using System.Text;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Portal.Autenticacao.Api.Configuration;
using Portal.Autenticacao.Api.Data;
using Portal.Autenticacao.Api.HealthChecks;
using Portal.Autenticacao.Api.Middlewares;
using Portal.Autenticacao.Api.Repositories;
using Portal.Autenticacao.Api.Repositories.Interfaces;
using Portal.Autenticacao.Api.Services;
using Portal.Autenticacao.Api.Services.Interfaces;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
EnvFileLoader.LoadFromSolutionOrProjectRoot(builder.Environment.ContentRootPath);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks()
    .AddCheck<PostgresHealthCheck>("postgres");
builder.Services.AddRouting(options => options.LowercaseUrls = true);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            ?? ["http://localhost:8082", "http://127.0.0.1:8082"];

        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

DefaultTypeMap.MatchNamesWithUnderscores = true;

builder.Services.AddSingleton(sp =>
{
    var connectionString = PostgresConnectionStringResolver.Resolve(sp.GetRequiredService<IConfiguration>());
    return NpgsqlDataSource.Create(connectionString);
});
builder.Services.AddScoped<IDbConnectionFactory, NpgsqlConnectionFactory>();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
JwtOptions.OverrideFromEnvironment(builder.Configuration);

var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
          ?? throw new InvalidOperationException("Configuracao Jwt ausente.");

if (string.IsNullOrWhiteSpace(jwt.SecretKey) || jwt.SecretKey.Length < 32)
{
    throw new InvalidOperationException(
        "JWT_SECRET nao configurada ou muito curta (minimo 32 caracteres). Configure via env JWT_SECRET.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SecretKey)),
            ClockSkew = TimeSpan.FromSeconds(jwt.ClockSkewSeconds)
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddScoped<IPerfilRepository, PerfilRepository>();
builder.Services.AddScoped<IEmpresaRepository, EmpresaRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();

builder.Services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

var app = builder.Build();

app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
