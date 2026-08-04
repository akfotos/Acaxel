# Extract student names and class info from Highcrest School Excel workbook
param(
  [string]$OutJson = 'D:\Web Clash\Acaxel-main\Acaxel-main\students-extracted.json'
)

Add-Type -AssemblyName System.IO.Compression.FileSystem
$file = 'D:\Web Clash\Acaxel-main\Acaxel-main\Highcrest School - Full Year Register 2025_26 - Payment Schedule Updated.xlsx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($file)

# Shared strings
$ssText = Get-Content 'D:\Web Clash\Acaxel-main\Acaxel-main\sharedStrings.xml' -Encoding Unicode -Raw
$ssMatches = [regex]::Matches($ssText, '<t[^>]*>([^<]*)</t>')
$sharedStrings = @($ssMatches | ForEach-Object { $_.Groups[1].Value })
Write-Host "Shared strings: $($sharedStrings.Count)"

function GetCellValue($c) {
  $v = if ($c.v) { $c.v } else { '' }
  if ($c.t -eq 's' -and $v -match '^\d+$') {
    return $sharedStrings[[int]$v]
  }
  return $v
}

function ReadSheet($sheetPath) {
  $entry = $zip.GetEntry($sheetPath)
  if (-not $entry) { return $null }
  $stream = $entry.Open()
  $reader = [System.IO.StreamReader]::new($stream)
  $xmlText = $reader.ReadToEnd()
  $reader.Close(); $stream.Close()
  $tmp = 'D:\Web Clash\Acaxel-main\Acaxel-main\_tmp_sheet.xml'
  $xmlText | Out-File $tmp -Encoding Unicode
  [xml]$xml = Get-Content $tmp -Encoding Unicode -Raw
  $ns = [System.Xml.XmlNamespaceManager]::new($xml.NameTable)
  $ns.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
  $cells = $xml.SelectNodes('//x:c', $ns)
  $data = @{}
  foreach ($c in $cells) {
    $ref = $c.r; if (-not $ref) { continue }
    $col = [regex]::Replace($ref, '\d+', '')
    $row = [int][regex]::Match($ref, '\d+').Value
    if (-not $data.ContainsKey($row)) { $data[$row] = @{} }
    $data[$row][$col] = GetCellValue $c
  }
  $maxRow = if ($data.Count -gt 0) { ($data.Keys | Measure-Object -Maximum).Maximum } else { 0 }
  return @{ cells = $data; maxRow = $maxRow }
}

# Class header patterns
$classPatterns = @(
  'Crèche:\s*Robins',
  'Nursery\s*1:\s*Starlings',
  'Nursery\s*2:\s*Goldfinches',
  'KG\s*1:\s*Kingfishers',
  'KG\s*2:\s*Hawks',
  'Grade\s*1:\s*Skylarks',
  'Grade\s*2:\s*Kestrels',
  'Grade\s*3:\s*Woodpeckers',
  'Grade\s*4:\s*Nightingales',
  'Grade\s*5:\s*Falcons'
)

function IsLikelyName($text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return $false }
  $text = $text.Trim()
  # Skip common non-name labels
  $skip = @('TOTAL', 'ARREARS', 'PAYMENT', 'TERM', 'WEEK', 'STAFF', 'SIBLING', 'WAIVER', 'NEW ENROLMENT', 'GHS', 'CRITICAL', 'HIGH', 'NEAR-FULL', 'MINOR', 'REDUCING', 'CONSISTENT', 'PARTIAL', 'GROWING', 'DOCUMENTED', 'CASE-BY-CASE', 'PROPRIETOR', 'MAX', 'ONLY', 'APPLIED', 'OIC', 'FEE', 'BALANCE', 'ARREAR', 'DISCOUNT', 'CREDIT', 'LUMP', 'QUARTERLY', 'MONTHLY', 'WEEKLY', 'CASH', 'MOMO', 'BANK', 'CHEQUE', 'VERIFIED', 'DATE', 'RECEIPT', 'TERM', 'AMOUNT', 'METHOD', 'RECEIVED', 'RUNNING', 'CUMULATIVE', 'TARGET', 'ACTUAL', 'APR', 'MAY', 'JUN', 'JUL', 'JAN', 'FEB', 'MAR', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'YES', 'NO', 'PAID', 'DUE', 'NET', 'RATE', 'CLASS', 'PUPIL', 'NOTES', 'REMARKS', 'STATUS', 'ACTION', 'REQUIRED', 'PRIOR', 'YEAR', 'JOINER', 'MID-YEAR', 'FULLY', 'SETTLED', 'COVERED')
  foreach ($s in $skip) { if ($text -like "*$s*") { return $false } }
  # Name pattern: 2-5 words, mostly letters/hyphens/periods/apostrophes, each word starts uppercase
  $words = $text -split '\s+' | Where-Object { $_ -ne '' }
  if ($words.Count -lt 2 -or $words.Count -gt 6) { return $false }
  foreach ($w in $words) {
    if ($w -notmatch '^[A-Z][A-Za-z\-\.\'']*$') { return $false }
  }
  return $true
}

$allStudents = @()

for ($si = 3; $si -le 23; $si++) {
  $sheet = ReadSheet "xl/worksheets/sheet$si.xml"
  if (-not $sheet) { continue }
  if ($sheet.maxRow -eq 0) { continue }

  $currentClass = ''
  $currentBirdHouse = ''

  for ($r = 1; $r -le $sheet.maxRow; $r++) {
    if (-not $sheet.cells.ContainsKey($r)) { continue }
    $row = $sheet.cells[$r]

    # Look for class header in any cell of this row
    foreach ($col in $row.Keys) {
      $val = $row[$col]
      if ($val -match '^\s*(Crèche|Nursery\s*\d|KG\s*\d|Grade\s*\d)\s*:\s*([^—\-–].*?)(?:\s*—|\s*-|\s*\||\s*$)') {
        $currentClass = $Matches[1].Trim()
        $currentBirdHouse = ($Matches[2] -split '\|')[0].Trim()
      }
    }

    # Look for names in columns A-D
    foreach ($col in @('A','B','C','D')) {
      if (-not $row.ContainsKey($col)) { continue }
      $val = $row[$col]
      if (IsLikelyName $val) {
        $allStudents += [ordered]@{
          fullName = $val
          class = $currentClass
          birdHouse = $currentBirdHouse
          sourceSheet = "sheet$si"
        }
      }
    }
  }
}

$zip.Dispose()

$out = @{
  extractedAt = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
  count = $allStudents.Count
  students = $allStudents
}

$out | ConvertTo-Json -Depth 10 | Out-File $OutJson -Encoding utf8
Write-Host "Extracted $($allStudents.Count) students -> $OutJson"
