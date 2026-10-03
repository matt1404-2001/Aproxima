using System.ComponentModel.DataAnnotations;

namespace EstimateArena.Api.Configuracion;

public sealed class OpcionesCors : IValidatableObject
{
    public const string Seccion = "Cors";

    public string[] OrigenesPermitidos { get; init; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (OrigenesPermitidos.Length == 0 || OrigenesPermitidos.Any(string.IsNullOrWhiteSpace))
        {
            yield return new ValidationResult(
                "Cors:OrigenesPermitidos debe contener al menos un origen valido.",
                [nameof(OrigenesPermitidos)]);
        }
    }
}
