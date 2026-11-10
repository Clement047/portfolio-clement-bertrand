<#
.SYNOPSIS
    Publie le portfolio sur https://clementbertrandportfolio.store

.DESCRIPTION
    1. Vérifie l'état Git (avertit s'il reste des modifications non commitées).
    2. Construit le site dans un dossier temporaire (le dossier dist/ du projet n'est pas touché).
    3. Retire les fichiers à ne pas publier (exports Blender inutilisés, pages de test, sauvegardes).
    4. Compare avec la version en ligne et n'envoie que les fichiers nouveaux ou modifiés.
    5. Crée une nouvelle version datée sur le VPS et bascule le site dessus.
    6. Vérifie que le site répond.

    Retour arrière : ssh root@45.147.96.184 portfolio rollback

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Simulation
    Montre ce qui serait envoyé, sans rien publier.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\deploy.ps1
    Publie la version actuelle du projet.
#>
param(
    [switch]$Simulation,  # n'envoie rien, affiche seulement les différences
    [switch]$Forcer       # publie une nouvelle version même sans différence
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Serveur = 'root@45.147.96.184'
$Site    = 'https://clementbertrandportfolio.store'
$SshOpts = @('-o', 'BatchMode=yes', '-o', 'ServerAliveInterval=15')
$Tar     = Join-Path $env:SystemRoot 'System32\tar.exe'

# Fichiers et dossiers du build à ne jamais publier
$Exclus = @(
    'models/villeportfolio_FINAL.glb',
    'models/villeportfolio_EXPORT.glb',
    'models/villeportfolio_WEB.glb',
    'models/villeportfolio_FAST.glb',
    'models/villeportfolio_FAST.glb.gz',
    'test-ville',
    'test-espace'
)
$MotifSauvegarde = '\.bak$|\.before-|\.backup|\.background-backup$'

function Etape([string]$texte) { Write-Host "`n== $texte" -ForegroundColor Cyan }
function Taille([long]$octets) {
    if ($octets -ge 1MB) { return '{0:N1} Mo' -f ($octets / 1MB) }
    return '{0:N0} Ko' -f ($octets / 1KB)
}

Set-Location -LiteralPath $PSScriptRoot

# --- 1. Git ---------------------------------------------------------------
Etape 'Vérification Git'
$commit = (git rev-parse --short HEAD).Trim()
$modifs = @(git status --porcelain)
if ($modifs.Count -gt 0) {
    Write-Host "Attention : $($modifs.Count) fichier(s) modifié(s) non commité(s). Ils seront publiés tels quels." -ForegroundColor Yellow
    $modifs | Select-Object -First 10 | ForEach-Object { Write-Host "   $_" }
    if (-not $Simulation) {
        $reponse = Read-Host 'Publier quand même ? (o/N)'
        if ($reponse -ne 'o') { Write-Host 'Publication annulée.'; exit 1 }
    }
    $commit = "$commit-modifie"
}
Write-Host "Commit : $commit"

# --- 2. Build -------------------------------------------------------------
$nom   = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$tmp   = Join-Path $env:TEMP "portfolio-deploy-$nom"
$build = Join-Path $tmp 'site'
New-Item -ItemType Directory -Path $tmp | Out-Null

try {
    Etape 'Build Astro (dossier temporaire)'
    & npx.cmd astro build --outDir $build
    if ($LASTEXITCODE -ne 0) { throw 'Le build a échoué : rien n''a été publié.' }

    # --- 3. Exclusions ----------------------------------------------------
    foreach ($e in $Exclus) {
        $chemin = Join-Path $build $e
        if (Test-Path -LiteralPath $chemin) { Remove-Item -LiteralPath $chemin -Recurse -Force }
    }
    Get-ChildItem -LiteralPath $build -Recurse -File |
        Where-Object { $_.Name -match $MotifSauvegarde } |
        Remove-Item -Force

    # --- 4. Comparaison avec la version en ligne --------------------------
    Etape 'Comparaison avec la version en ligne'
    $racine = (Resolve-Path -LiteralPath $build).Path.TrimEnd('\') + '\'
    $local  = @{}
    $poids  = @{}
    Get-ChildItem -LiteralPath $build -Recurse -File | ForEach-Object {
        $rel = './' + $_.FullName.Substring($racine.Length).Replace('\', '/')
        $local[$rel] = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()
        $poids[$rel] = $_.Length
    }

    $distant = @{}
    $manifeste = & ssh @SshOpts $Serveur 'portfolio manifest'
    if ($LASTEXITCODE -ne 0) { throw 'Impossible de lire la version en ligne (connexion SSH ?).' }
    foreach ($ligne in $manifeste) {
        if ($ligne -match '^([0-9a-f]{64})\s+\*?(.+)$') { $distant[$Matches[2]] = $Matches[1] }
    }

    $aEnvoyer  = @($local.Keys | Where-Object { $distant[$_] -ne $local[$_] } | Sort-Object)
    $aGarder   = @($local.Keys | Where-Object { $distant[$_] -eq $local[$_] } | Sort-Object)
    $supprimes = @($distant.Keys | Where-Object { -not $local.ContainsKey($_) } | Sort-Object)
    $volume    = ($aEnvoyer | ForEach-Object { $poids[$_] } | Measure-Object -Sum).Sum

    Write-Host ("Fichiers inchangés : {0}" -f $aGarder.Count)
    Write-Host ("Nouveaux ou modifiés : {0} ({1})" -f $aEnvoyer.Count, (Taille $volume))
    Write-Host ("Retirés du site : {0}" -f $supprimes.Count)
    $aEnvoyer  | Select-Object -First 25 | ForEach-Object { Write-Host "   + $_" -ForegroundColor Green }
    $supprimes | Select-Object -First 25 | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }

    if ($aEnvoyer.Count -eq 0 -and $supprimes.Count -eq 0 -and -not $Forcer) {
        Write-Host "`nRien à publier : le site en ligne est déjà à jour." -ForegroundColor Green
        exit 0
    }
    if ($Simulation) {
        Write-Host "`nSimulation : rien n'a été envoyé." -ForegroundColor Yellow
        exit 0
    }

    # --- 5. Envoi et activation -------------------------------------------
    Etape "Envoi de la version $nom"
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    $listeGarder = Join-Path $tmp 'keep.txt'
    $listeTar    = Join-Path $tmp 'tar.txt'
    $archive     = Join-Path $tmp 'upload.tar'
    $texteGarder = ''
    if ($aGarder.Count -gt 0) { $texteGarder = ($aGarder -join "`n") + "`n" }
    [IO.File]::WriteAllText($listeGarder, $texteGarder, $utf8)

    if ($aEnvoyer.Count -gt 0) {
        [IO.File]::WriteAllText($listeTar, (($aEnvoyer -join "`n") + "`n"), $utf8)
        & $Tar -cf $archive -C $build -T $listeTar
        if ($LASTEXITCODE -ne 0) { throw 'Création de l''archive impossible.' }
    } else {
        [IO.File]::WriteAllBytes($archive, [byte[]]@())
    }

    & scp -q @SshOpts $archive "${Serveur}:/tmp/portfolio-upload.tar"
    if ($LASTEXITCODE -ne 0) { throw 'Envoi de l''archive impossible.' }
    & scp -q @SshOpts $listeGarder "${Serveur}:/tmp/portfolio-keep.txt"
    if ($LASTEXITCODE -ne 0) { throw 'Envoi de la liste impossible.' }

    Etape 'Activation sur le VPS'
    & ssh @SshOpts $Serveur "portfolio activate $nom $commit"
    if ($LASTEXITCODE -ne 0) { throw 'Activation refusée : le site en ligne n''a pas changé.' }

    # --- 6. Vérification ---------------------------------------------------
    Etape 'Vérification du site'
    $pages = @('/', '/portfolio-2d/', '/contact/', '/projets/sull/')
    $index = Get-Content -LiteralPath (Join-Path $build 'index.html') -Raw
    $asset = [regex]::Match($index, '/_astro/[^"'']+\.(js|css)').Value
    if ($asset) { $pages += $asset }
    $erreurs = 0
    foreach ($p in $pages) {
        try {
            $r = Invoke-WebRequest -Uri ($Site + $p) -UseBasicParsing -Method Head -TimeoutSec 20
            Write-Host ("   {0}  {1}" -f $r.StatusCode, $p)
        } catch {
            Write-Host ("   ERREUR  {0}  {1}" -f $p, $_.Exception.Message) -ForegroundColor Red
            $erreurs++
        }
    }
    if ($erreurs -gt 0) {
        Write-Host "`n$erreurs vérification(s) en échec. Pour revenir à la version précédente :" -ForegroundColor Red
        Write-Host "   ssh $Serveur portfolio rollback"
        exit 1
    }
    Write-Host "`nPublié : $Site  (version $nom, commit $commit)" -ForegroundColor Green
    Write-Host "Retour arrière si besoin : ssh $Serveur portfolio rollback"
}
finally {
    if ($tmp -like (Join-Path $env:TEMP 'portfolio-deploy-*') -and (Test-Path -LiteralPath $tmp)) {
        Remove-Item -LiteralPath $tmp -Recurse -Force
    }
}
