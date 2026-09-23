; ========================================================
; RESTAURANT POS — CLIENT TERMINAL INSTALLER SCRIPT
; Lightweight Desktop Client (Waiter / Kitchen / Terminal)
; Zero Database, Zero Java Runtime (~65 MB)
; ========================================================

#define AppName "Restaurant POS Client"
#define AppVersion "1.0.0"
#define AppPublisher "Restaurant POS Solutions"
#define AppExeName "RestaurantPOS.exe"

[Setup]
AppId={{C42862B1-4A56-42E1-BF34-118E8AC35D19}}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\RestaurantPOS-Client
DefaultGroupName={#AppName}
AllowNoIcons=yes
OutputDir=..\dist\installer
OutputBaseFilename=RestaurantPOS-Client-Setup-1.0.0
SetupIconFile=..\desktop\electron\assets\icon.ico
UninstallDisplayIcon={app}\{#AppExeName}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Dirs]
Name: "{commonappdata}\RestaurantPOS"; Permissions: users-full
Name: "{commonappdata}\RestaurantPOS\config"; Permissions: users-full
Name: "{commonappdata}\RestaurantPOS\logs"; Permissions: users-full

[Files]
; 1. Electron Desktop Shell & Angular Frontend Only
Source: "..\dist\desktop\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "backend,backend\*"

; 2. Client Mode Configuration Template
Source: "config\app-mode-client.json"; DestDir: "{commonappdata}\RestaurantPOS\config"; DestName: "app-mode.json"; Flags: onlyifdoesntexist uninsneveruninstall

[Icons]
Name: "{autoprograms}\{#AppName}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"
Name: "{autoprograms}\{#AppName}\O'chirish (Uninstall)"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon; IconFilename: "{app}\{#AppExeName}"

[Run]
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(AppName, '&', '&&')}}"; Flags: runasoriginaluser nowait postinstall skipifsilent

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    // Grant Full Control to BUILTIN\Users (SID S-1-5-32-545) on ProgramData
    Exec('icacls.exe', '"' + ExpandConstant('{commonappdata}\RestaurantPOS') + '" /grant:r "*S-1-5-32-545:(OI)(CI)F" /T /Q /C', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    // Clean install enforcement: ensure no leftover demo credentials or storage
    SaveStringToFile(ExpandConstant('{commonappdata}\RestaurantPOS\config\clean-install.flag'), 'CLEAN_INSTALL', False);
    DelTree(ExpandConstant('{userappdata}\restaurant-pos-desktop\Local Storage'), True, True, True);
    DelTree(ExpandConstant('{userappdata}\restaurant-pos-desktop\Session Storage'), True, True, True);
    DelTree(ExpandConstant('{userappdata}\RestaurantPOS\Local Storage'), True, True, True);
  end;
end;
