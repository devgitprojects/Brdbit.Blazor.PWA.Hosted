using System.Net.Http.Json;

using Brdbit.Blazor.PWA.Hosted.Shared;

using Microsoft.AspNetCore.Components;

namespace Brdbit.Blazor.PWA.Hosted.Web.Client.Pages;

public partial class Weather
{
    private WeatherForecast[]? forecasts;

    [Inject] 
    public HttpClient Http { get; set; } = default!;

    protected override async Task OnInitializedAsync()
    {
        forecasts = await Http.GetFromJsonAsync<WeatherForecast[]>("/weatherforecast");
    }
}