FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY Portal.Autenticacao.Api.csproj ./
RUN dotnet restore Portal.Autenticacao.Api.csproj

COPY . .
RUN dotnet publish Portal.Autenticacao.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:5001
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5001

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Portal.Autenticacao.Api.dll"]
