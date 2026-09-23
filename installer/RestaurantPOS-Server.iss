; ========================================================
; RESTAURANT POS — CENTRAL SERVER INSTALLER SCRIPT
; Single Offline Installer with PostgreSQL + JRE + Spring Boot
; ========================================================

#define AppName "Restaurant POS Server"
#define AppVersion "1.0.0"
#define AppPublisher "Restaurant POS Solutions"
#define AppExeName "RestaurantPOS.exe"

[Setup]
AppId={{D819779E-D6A4-4A1E-9C78-5C4E5BB26F41}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\RestaurantPOS-Server
DefaultGroupName={#AppName}
AllowNoIcons=yes
OutputDir=..\dist\installer
OutputBaseFilename=RestaurantPOS-Server-Setup-1.0.0
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
Name: "startupentry"; Description: "Windows ishga tushganda POS serverni avtomatik fonda ishga tushirish (System Tray)"; GroupDescription: "Tizim sozlamalari:"; Flags: unchecked

[Registry]
Root: HKLM; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "RestaurantPOS-Server"; ValueData: """{app}\{#AppExeName}"" --autostart"; Tasks: startupentry; Flags: uninsdeletevalue

[Dirs]
Name: "{commonappdata}\RestaurantPOS"; Permissions: users-full
Name: "{commonappdata}\RestaurantPOS\PostgreSQL"; Permissions: users-full
Name: "{commonappdata}\RestaurantPOS\PostgreSQL\data"; Permissions: users-full
Name: "{commonappdata}\RestaurantPOS\config"; Permissions: users-full
Name: "{commonappdata}\RestaurantPOS\logs"; Permissions: users-full
Name: "{commonappdata}\RestaurantPOS\uploads"; Permissions: users-full
Name: "{commonappdata}\RestaurantPOS\receipts"; Permissions: users-full
Name: "{commonappdata}\RestaurantPOS\backups"; Permissions: users-full

[Files]
; 1. Electron Desktop Shell & Angular Frontend
Source: "..\dist\desktop\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; 2. Embedded JRE 21 Runtime (jlink)
Source: "..\dist\staging\jre\*"; DestDir: "{app}\jre"; Flags: ignoreversion recursesubdirs createallsubdirs

; 3. Embedded PostgreSQL 18 Binaries
Source: "..\dist\staging\pgsql\*"; DestDir: "{app}\pgsql"; Flags: ignoreversion recursesubdirs createallsubdirs

; 4. Server App Mode Config
Source: "config\app-mode-server.json"; DestDir: "{app}"; DestName: "app-mode.json"; Flags: ignoreversion
Source: "config\app-mode-server.json"; DestDir: "{commonappdata}\RestaurantPOS\config"; DestName: "app-mode.json"; Flags: onlyifdoesntexist uninsneveruninstall

; 5. Production Properties
Source: "config\application-prod.properties"; DestDir: "{commonappdata}\RestaurantPOS\config"; DestName: "application.properties"; Flags: onlyifdoesntexist uninsneveruninstall

[Icons]
Name: "{autoprograms}\{#AppName}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"
Name: "{autoprograms}\{#AppName}\O'chirish (Uninstall)"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon; IconFilename: "{app}\{#AppExeName}"

[Run]
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(AppName, '&', '&&')}}"; Flags: runasoriginaluser nowait postinstall skipifsilent

[Code]
// ========================================================
// Custom Pascal Scripting for Cluster Init, Firewall & Safe Uninstall
// ========================================================

procedure CurStepChanged(CurStep: TSetupStep);
var
  DataDir: String;
  InitDbExe: String;
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    DataDir := ExpandConstant('{commonappdata}\RestaurantPOS\PostgreSQL\data');
    InitDbExe := ExpandConstant('{app}\pgsql\bin\initdb.exe');

    // 1. Initialize database cluster only if PG_VERSION is missing
    if not FileExists(DataDir + '\PG_VERSION') and FileExists(InitDbExe) then
    begin
      WizardForm.StatusLabel.Caption := 'Mahalliy ma''lumotlar bazasi klasteri sozlanmoqda...';
      Exec(InitDbExe, '-D "' + DataDir + '" -U pos_user -E UTF8 --locale=C -A trust', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    end;

    // 2. Grant recursive Full Control to BUILTIN\Users (SID S-1-5-32-545) on ProgramData directory
    Exec('icacls.exe', '"' + ExpandConstant('{commonappdata}\RestaurantPOS') + '" /grant:r "*S-1-5-32-545:(OI)(CI)F" /T /Q /C', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    // 3. Configure Windows Firewall rules for LAN Client access (Port 8080 TCP & 38888 UDP)
    Exec('netsh.exe', 'advfirewall firewall delete rule name="RestaurantPOS Server (TCP 8080)"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('netsh.exe', 'advfirewall firewall add rule name="RestaurantPOS Server (TCP 8080)" dir=in action=allow protocol=TCP localport=8080 profile=any', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    Exec('netsh.exe', 'advfirewall firewall delete rule name="RestaurantPOS Discovery (UDP 38888)"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('netsh.exe', 'advfirewall firewall add rule name="RestaurantPOS Discovery (UDP 38888)" dir=in action=allow protocol=UDP localport=38888 profile=any', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    // 4. Force a completely clean install: create clean-install.flag and purge any leftover user storage
    SaveStringToFile(ExpandConstant('{commonappdata}\RestaurantPOS\config\clean-install.flag'), 'CLEAN_INSTALL', False);
    DelTree(ExpandConstant('{userappdata}\restaurant-pos-desktop\Local Storage'), True, True, True);
    DelTree(ExpandConstant('{userappdata}\restaurant-pos-desktop\Session Storage'), True, True, True);
    DelTree(ExpandConstant('{userappdata}\RestaurantPOS\Local Storage'), True, True, True);
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  DataDir: String;
  DeleteDataPrompt: Integer;
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    // 1. Terminate running POS desktop process safely before file deletion
    Exec('taskkill.exe', '/f /im RestaurantPOS.exe /t', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    DataDir := ExpandConstant('{commonappdata}\RestaurantPOS');
    DeleteDataPrompt := MsgBox(
      'Barcha ma''lumotlar bazasi, savdo tarixi, mahsulot rasmlari va cheklar ham o''chirilsinmi?' + #13#10 + #13#10 +
      'OGOHLANTIRISH: Agar "Ha" tanlansa barcha savdo ma''lumotlari butunlay o''chib ketadi!' + #13#10 +
      'Standart holatda ma''lumotlarni saqlab qolish uchun "Yo''q" tugmasini bosing.',
      mbConfirmation, MB_YESNO or MB_DEFBUTTON2
    );

    if DeleteDataPrompt = IDYES then
    begin
      DelTree(DataDir, True, True, True);
    end;

    // Clean up firewall rules
    Exec('netsh.exe', 'advfirewall firewall delete rule name="RestaurantPOS Server (TCP 8080)"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('netsh.exe', 'advfirewall firewall delete rule name="RestaurantPOS Discovery (UDP 38888)"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
