namespace JobTrail.Api.Services;

// The time zone of the user's device, sent by the web and the extension in the X-Time-Zone header
// as an IANA name (for example "America/Argentina/Buenos_Aires"). It decides where a day starts and
// ends, so "today" is the user's today. Without the header, or with an unknown name, days are UTC.
public class ClientTimeZone
{
    #region Consts
    public const string HeaderName = "X-Time-Zone";

    #endregion

    #region Constructor

    private readonly TimeZoneInfo _timeZone;

    public ClientTimeZone(IHttpContextAccessor httpContextAccessor)
    {
        var id = httpContextAccessor.HttpContext?.Request.Headers[HeaderName].ToString();
        _timeZone = !string.IsNullOrWhiteSpace(id) && TimeZoneInfo.TryFindSystemTimeZoneById(id.Trim(), out var timeZone)
            ? timeZone
            : TimeZoneInfo.Utc;
    }
    #endregion

    #region Helpers

    // The calendar day the user sees on their device at that moment.
    public DateOnly ToLocalDate(DateTimeOffset value)
    {
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(value, _timeZone).DateTime);
    }

    // Midnight of that day on the user's device, as a UTC moment (Npgsql only writes UTC offsets).
    public DateTimeOffset StartOfDay(DateOnly day)
    {
        var midnight = day.ToDateTime(TimeOnly.MinValue);
        return new DateTimeOffset(midnight, _timeZone.GetUtcOffset(midnight)).ToUniversalTime();
    }
    #endregion
}
