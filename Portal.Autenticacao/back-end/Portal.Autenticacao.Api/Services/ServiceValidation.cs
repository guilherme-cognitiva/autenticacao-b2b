using System.Text.RegularExpressions;
using Portal.Autenticacao.Api.Exceptions;

namespace Portal.Autenticacao.Api.Services;

internal static class ServiceValidation
{
    private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

    public static string Required(string? value, string fieldName, int maxLength)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new DomainException($"{fieldName} e obrigatorio.");
        }

        if (normalized.Length > maxLength)
        {
            throw new DomainException($"{fieldName} deve ter no maximo {maxLength} caracteres.");
        }

        return normalized;
    }

    public static string? Optional(string? value, string fieldName, int maxLength)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        if (normalized?.Length > maxLength)
        {
            throw new DomainException($"{fieldName} deve ter no maximo {maxLength} caracteres.");
        }

        return normalized;
    }

    public static string RequiredEmail(string? value, string fieldName)
    {
        var normalized = Required(value, fieldName, 150).ToLowerInvariant();
        if (!EmailRegex.IsMatch(normalized))
        {
            throw new DomainException($"{fieldName} invalido.");
        }
        return normalized;
    }

    public static string RequiredCnpj(string? value)
    {
        var digits = new string((value ?? string.Empty).Where(char.IsDigit).ToArray());
        if (digits.Length != 14)
        {
            throw new DomainException("CNPJ deve conter 14 digitos.");
        }
        return digits;
    }

    public static string RequiredCep(string? value)
    {
        var digits = new string((value ?? string.Empty).Where(char.IsDigit).ToArray());
        if (digits.Length != 8)
        {
            throw new DomainException("CEP deve conter 8 digitos.");
        }
        return digits;
    }

    public static string RequiredEstado(string? value)
    {
        var normalized = (value ?? string.Empty).Trim().ToUpperInvariant();
        if (normalized.Length != 2 || !normalized.All(char.IsLetter))
        {
            throw new DomainException("Estado (UF) deve conter 2 letras.");
        }
        return normalized;
    }

    public static string RequiredSenha(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new DomainException("Senha e obrigatoria.");
        }
        if (value.Length < 8)
        {
            throw new DomainException("Senha deve ter no minimo 8 caracteres.");
        }
        if (value.Length > 100)
        {
            throw new DomainException("Senha deve ter no maximo 100 caracteres.");
        }
        return value;
    }
}
