Add-Type -AssemblyName PresentationCore,PresentationFramework,WindowsBase
$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([Uri]'C:\Users\Lenovo\Downloads\Video-60774.mp4')
$player.Volume = 0
$player.Play()
$frame = New-Object System.Windows.Threading.DispatcherFrame
$timer = New-Object System.Windows.Threading.DispatcherTimer
$timer.Interval = [TimeSpan]::FromSeconds(3)
$timer.Add_Tick({ $timer.Stop(); $frame.Continue = $false })
$timer.Start()
[System.Windows.Threading.Dispatcher]::PushFrame($frame)
Write-Output "Duration: $($player.NaturalDuration.TimeSpan.TotalSeconds) Size: $($player.NaturalVideoWidth)x$($player.NaturalVideoHeight)"
$duration = $player.NaturalDuration.TimeSpan.TotalSeconds
for ($i = 0; $i -lt 8; $i++) {
  $player.Position = [TimeSpan]::FromSeconds(($duration * $i / 8))
  $f = New-Object System.Windows.Threading.DispatcherFrame
  $t = New-Object System.Windows.Threading.DispatcherTimer
  $t.Interval = [TimeSpan]::FromMilliseconds(650)
  $t.Add_Tick({ $t.Stop(); $f.Continue = $false })
  $t.Start()
  [System.Windows.Threading.Dispatcher]::PushFrame($f)
  $visual = New-Object System.Windows.Media.DrawingVisual
  $dc = $visual.RenderOpen()
  $dc.DrawVideo($player, [System.Windows.Rect]::new(0,0,$player.NaturalVideoWidth,$player.NaturalVideoHeight))
  $dc.Close()
  $bitmap = [System.Windows.Media.Imaging.RenderTargetBitmap]::new($player.NaturalVideoWidth,$player.NaturalVideoHeight,96,96,[System.Windows.Media.PixelFormats]::Pbgra32)
  $bitmap.Render($visual)
  $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
  $stream = [System.IO.File]::Create("E:\projects\PILL\video-frame-$i.png")
  $encoder.Save($stream)
  $stream.Close()
}
$player.Close()
