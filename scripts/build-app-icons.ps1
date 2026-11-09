# Rebuild PWA, Android maskable, and Apple home-screen icons from the approved artwork.
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$source = [System.Drawing.Image]::FromFile((Join-Path $projectRoot 'assets/app-icon-source.png'))
try {
  foreach ($spec in @(@('icon-192.png',192,1.0),@('icon-512.png',512,1.0),@('icon-512-maskable.png',512,0.8),@('apple-touch-icon.png',180,1.0))) {
    $size = [int]$spec[1]
    $bitmap = New-Object System.Drawing.Bitmap($size,$size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.Clear([System.Drawing.Color]::FromArgb(76,190,229))
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $extent = [int][Math]::Round($size * [double]$spec[2])
      $offset = [int][Math]::Floor(($size-$extent)/2)
      $graphics.DrawImage($source,$offset,$offset,$extent,$extent)
      $bitmap.Save((Join-Path $projectRoot ('public/' + $spec[0])),[System.Drawing.Imaging.ImageFormat]::Png)
      Write-Output ($spec[0] + ' ' + $size + 'x' + $size)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
  }
} finally { $source.Dispose() }
