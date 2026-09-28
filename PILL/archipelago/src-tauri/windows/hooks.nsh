!macro NSIS_HOOK_POSTINSTALL

  ; Create a Start Menu shortcut for PILL Control.
  CreateShortCut \
    "$SMPROGRAMS\PILL Control.lnk" \
    "$INSTDIR\resources\PILL-Control.exe"

!macroend


!macro NSIS_HOOK_POSTUNINSTALL

  ; Remove the PILL Control shortcut during uninstall.
  Delete "$SMPROGRAMS\PILL Control.lnk"

!macroend