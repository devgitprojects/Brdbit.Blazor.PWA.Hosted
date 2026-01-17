using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace Brdbit.Blazor.PWA.Hosted.Web.Client.Shared.Controls;

/// <summary>
/// A Blazor component that displays an “update available” notification when a new Service Worker
/// version is installed. The notification shows the new version and provides an Update button.
/// The component also renders a fixed current-version label in the bottom-right corner of the page.
/// This component interacts with a Service Worker via JavaScript interop.
/// </summary>
public partial class AppUpdateNotification : IDisposable
{
    protected DotNetObjectReference<AppUpdateNotification>? objRef;
    private bool disposedValue;
    private string currentServiceWorkerVersion = string.Empty;
    private string newServiceWorkerCacheVersion = string.Empty;
    
    [Inject] public IJSRuntime JsRuntime { get; set; } = default!;

    /// <summary>
    /// Raised when a new Service Worker has been installed and an update is ready.
    /// </summary>
    [Parameter]
    public EventCallback<UpdateAvailableEventArgs> UpdateAvailable { get; set; }

    /// <summary>
    /// Raised when the Update button is clicked.
    /// Note: the callback parameter type is <see cref="UpdateAvailableEventArgs"/>.
    /// If you need to cancel the update set IsApplyNewVersion to false
    /// </summary>
    [Parameter]
    public EventCallback<UpdateAvailableEventArgs> ButtonUpdateClicked { get; set; }

    /// <summary>
    /// Represents update available text with version span element with id 'newSWversionLabel' inside text. 
    /// This span element is updated from JS by id when new version of SW is installed.
    /// </summary>
    [Parameter]
    public virtual string UpdateAvailableText { get; set; } = @"Update available <span id=""newSWversionLabel"">{0}</span>. Please save your work and click 'Update'";

    [Parameter]
    public string UpdateButtonText { get; set; } = "Update";

    /// <summary>
    /// CSS classes applied to the component root element.
    /// </summary>
    [Parameter]
    public string CssClass { get; set; } = "update-available-container update-available-container-position-size";

    /// <summary>
    /// CSS classes applied to the notification text.
    /// </summary>
    [Parameter]
    public string CssClassText { get; set; } = "update-available-text ";

    /// <summary>
    /// CSS classes applied to the Update button.
    /// </summary>
    [Parameter]
    public string CssClassButton { get; set; } = "btn btn-light ";

    /// <summary>
    /// Inline style applied to the component root element.
    /// </summary>
    [Parameter]
    public string? Style { get; set; }

    /// <summary>
    /// Inline style applied to the current version label.
    /// </summary>
    [Parameter]
    public string? StyleCurrentVersionLabel { get; set; }
    
    /// <summary>
    /// CSS classes applied to the current version label.
    /// </summary>
    [Parameter]
    public string CssClassAppVersionLabel { get; set; } = "small-app-version-bottom-right text-muted";

    /// <summary>
    /// Indicates whether a new Service Worker version is installed and ready to be applied.
    /// </summary>
    public bool IsUpdateReady { get; protected set; }

    protected DotNetObjectReference<AppUpdateNotification> ObjectReference
    {
        get
        {
            objRef ??= DotNetObjectReference.Create(this);
            return objRef;
        }
    }

    public override async Task SetParametersAsync(ParameterView parameters)
    {
        parameters.SetParameterProperties(this);
        
        // Here is only initial value. Value of labels are changed on JS side. 
        currentServiceWorkerVersion = (await GetCurrentServiceWorkerVersion()) ?? string.Empty;
        newServiceWorkerCacheVersion = (await GetNewServiceWorkerVersion()) ?? string.Empty;

        await base.SetParametersAsync(ParameterView.Empty);
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        await base.OnAfterRenderAsync(firstRender);

        if (firstRender)
        {
            await JsRuntime.InvokeVoidAsync("registerUpdateAvailableHandler", ObjectReference);
        }
    }

    /// <summary>
    /// Invoked from JavaScript when a new Service Worker version is installed and an update is ready.
    /// </summary>
    [JSInvokable]
    public Task<UpdateAvailableEventArgs> OnUpdateAvailable(UpdateAvailableEventArgs args)
    {
        return OnUpdateAvailableHandler(args);
    }

    /// <summary>
    /// Invoked from JS when Update button is clicked. 
    /// Property ButtonUpdateClickEventArgs.IsApplyNewVersion can discard update process if set to false
    /// </summary>
    /// <param name="args"></param>
    /// <returns></returns>
    [JSInvokable]
    public Task<UpdateAvailableEventArgs> OnButtonUpdateClicked(ButtonUpdateClickEventArgs args)
    {
        return OnButtonUpdateClickedHandler(args);
    }

    /// <summary>
    /// Handler invoked when an update is available. Override in derived components if needed.
    /// <seealso cref="OnUpdateAvailable"/>
    /// </summary>
    public virtual async Task<UpdateAvailableEventArgs> OnUpdateAvailableHandler(UpdateAvailableEventArgs args)
    {
        IsUpdateReady = args.IsUpdateReady;

        if (UpdateAvailable.HasDelegate)
            await UpdateAvailable.InvokeAsync(args);

        await InvokeAsync(StateHasChanged);
        return args;
    }

    /// <summary>
    /// Handler invoked when the Update button is clicked. Override in derived components if needed.
    /// <seealso cref="OnButtonUpdateClicked"/>
    /// </summary>
    public virtual async Task<UpdateAvailableEventArgs> OnButtonUpdateClickedHandler(ButtonUpdateClickEventArgs args)
    {
        args.IsApplyNewVersion = true;
        if (ButtonUpdateClicked.HasDelegate)
            await ButtonUpdateClicked.InvokeAsync(args);

        return args;
    }

    private ValueTask<string> GetCurrentServiceWorkerVersion()
    {
        return JsRuntime.InvokeAsync<string>("getCurrentSWcacheVersion");
    }

    private ValueTask<string> GetNewServiceWorkerVersion()
    {
        return JsRuntime.InvokeAsync<string>("getNewSWcacheVersion");
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!disposedValue)
        {
            if (disposing)
            {
                objRef?.Dispose();
            }

            objRef = null!;
            disposedValue = true;
        }
    }

    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }
}

public class UpdateAvailableEventArgs : ChangeEventArgs
{
    public bool IsUpdateReady { get; set; }
}

public class ButtonUpdateClickEventArgs : UpdateAvailableEventArgs
{
    public bool IsApplyNewVersion { get; set; }
}