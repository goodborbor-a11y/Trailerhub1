$totalLines = 0
$extensions = "*.ts", "*.tsx", "*.js", "*.jsx", "*.css", "*.html", "*.sql", "*.json"
$exclude = "node_modules", "dist", "build", ".git"

$files = Get-ChildItem -Path . -Recurse -File -Include $extensions | Where-Object { 
    $filePath = $_.FullName
    $skip = $false
    foreach ($ex in $exclude) {
        if ($filePath -like "*\$ex\*") { $skip = $true; break }
    }
    $skip -eq $false
}

foreach ($file in $files) {
    try {
        $lines = (Get-Content $file.FullName | Measure-Object -Line).Lines
        $totalLines += $lines
    } catch {
        # Skip files that can't be read
    }
}

Write-Output "TOTAL LINES OF CODE: $totalLines"
