namespace Portal.Autenticacao.Api.Configuration;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "portal-autenticacao";
    public string Audience { get; set; } = "portal-b2b";
    public string SecretKey { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 240;
    public int ClockSkewSeconds { get; set; } = 60;

    public static void OverrideFromEnvironment(IConfiguration configuration)
    {
        var section = configuration.GetSection(SectionName);

        var envSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
        if (!string.IsNullOrWhiteSpace(envSecret))
        {
            section["SecretKey"] = envSecret;
        }

        var envIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
        if (!string.IsNullOrWhiteSpace(envIssuer))
        {
            section["Issuer"] = envIssuer;
        }

        var envAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");
        if (!string.IsNullOrWhiteSpace(envAudience))
        {
            section["Audience"] = envAudience;
        }

        var envExp = Environment.GetEnvironmentVariable("JWT_EXPIRATION_MINUTES");
        if (int.TryParse(envExp, out var exp) && exp > 0)
        {
            section["ExpirationMinutes"] = exp.ToString();
        }

        var envClockSkew = Environment.GetEnvironmentVariable("JWT_CLOCK_SKEW_SECONDS");
        if (int.TryParse(envClockSkew, out var skew) && skew >= 0)
        {
            section["ClockSkewSeconds"] = skew.ToString();
        }
    }
}
