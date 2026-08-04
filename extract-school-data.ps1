# Extract complete Highcrest School data from the Excel workbook
param(
  [string]$OutDir = 'D:\Web Clash\Acaxel-main\Acaxel-main\data'
)

Add-Type -AssemblyName System.IO.Compression.FileSystem
$file = 'D:\Web Clash\Acaxel-main\Acaxel-main\Highcrest School - Full Year Register 2025_26 - Payment Schedule Updated.xlsx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($file)

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

# Extract shared strings
$ssEntry = $zip.GetEntry('xl/sharedStrings.xml')
$ssStream = $ssEntry.Open()
$ssReader = [System.IO.StreamReader]::new($ssStream)
$ssText = $ssReader.ReadToEnd()
$ssReader.Close(); $ssStream.Close()
$ssText | Out-File "$OutDir\sharedStrings.xml" -Encoding Unicode
$ssMatches = [regex]::Matches($ssText, '<t[^>]*>([^<]*)</t>')
$sharedStrings = @($ssMatches | ForEach-Object { $_.Groups[1].Value })
Write-Host "Shared strings: $($sharedStrings.Count)"

function GetCellValue($c) {
  $v = if ($c.v) { $c.v } else { '' }
  if ($c.t -eq 's' -and $v -match '^\d+$') { return $sharedStrings[[int]$v] }
  return $v
}

function ReadSheet($sheetPath) {
  $entry = $zip.GetEntry($sheetPath); if (-not $entry) { return $null }
  $stream = $entry.Open(); $reader = [System.IO.StreamReader]::new($stream); $xmlText = $reader.ReadToEnd(); $reader.Close(); $stream.Close()
  $tmp = "$OutDir\_tmp_sheet.xml"; $xmlText | Out-File $tmp -Encoding Unicode
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

# ----------------------------------------------------------------
# 1. FEE SCHEDULE (sheet1)
# ----------------------------------------------------------------
$feeSheet = ReadSheet 'xl/worksheets/sheet1.xml'
$feeSchedule = @()
for ($r = 5; $r -le 16; $r++) {
  if (-not $feeSheet.cells.ContainsKey($r)) { continue }
  $row = $feeSheet.cells[$r]
  if (-not $row.A -and -not $row.B) { continue }
  $feeSchedule += [ordered]@{
    classLevel = $row.A
    birdHouse = $row.B
    annualFee = [double]($row.C -as [double])
    termlyFee = [double]($row.D -as [double])
    staffOicFee = [double]($row.E -as [double])
    programme = $row.F
    weeks = [double]($row.G -as [double])
    monthlyEquiv = [double]($row.H -as [double])
  }
}

# ----------------------------------------------------------------
# 2. FULL YEAR REGISTER SUMMARY (sheet2)
# ----------------------------------------------------------------
$summarySheet = ReadSheet 'xl/worksheets/sheet2.xml'
$fullYearRegister = @()
for ($r = 5; $r -le 14; $r++) {
  if (-not $summarySheet.cells.ContainsKey($r)) { continue }
  $row = $summarySheet.cells[$r]
  if (-not $row.A -and -not $row.C) { continue }
  $fullYearRegister += [ordered]@{
    class = $row.A
    birdHouse = $row.B
    enrolled = [int]($row.C -as [int])
    annualFee = [double]($row.D -as [double])
    t1Due = [double]($row.E -as [double])
    t1Paid = [double]($row.F -as [double])
    t1Balance = [double]($row.G -as [double])
    t1RatePct = [double]($row.H -as [double]) * 100
    t2Due = [double]($row.I -as [double])
    t2Discount = [double]($row.J -as [double])
    t2Paid = [double]($row.K -as [double])
    t2Balance = [double]($row.L -as [double])
    t2RatePct = [double]($row.M -as [double]) * 100
    t3Fee = [double]($row.N -as [double])
    t3Discount = [double]($row.O -as [double])
    t3Arrears = [double]($row.P -as [double])
    t3NetDue = [double]($row.Q -as [double])
  }
}

# Totals row (R15)
$totalsRow = $summarySheet.cells[15]
$fullYearTotals = [ordered]@{
  totalEnrolled = [int]($totalsRow.C -as [int])
  totalT1Due = [double]($totalsRow.E -as [double])
  totalT1Paid = [double]($totalsRow.F -as [double])
  totalT1Balance = [double]($totalsRow.G -as [double])
  totalT1RatePct = [double]($totalsRow.H -as [double]) * 100
  totalT2Due = [double]($totalsRow.I -as [double])
  totalT2Discount = [double]($totalsRow.J -as [double])
  totalT2Paid = [double]($totalsRow.K -as [double])
  totalT2Balance = [double]($totalsRow.L -as [double])
  totalT2RatePct = [double]($totalsRow.M -as [double]) * 100
  totalT3Fee = [double]($totalsRow.N -as [double])
  totalT3Discount = [double]($totalsRow.O -as [double])
  totalT3Arrears = [double]($totalsRow.P -as [double])
  totalT3NetDue = [double]($totalsRow.Q -as [double])
}

# ----------------------------------------------------------------
# 3. STUDENT ROSTER from class detail sheets (sheet3,5,7,...)
# ----------------------------------------------------------------
function IsLikelyName($text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return $false }
  $text = $text.Trim()
  $skip = @('TOTAL','ARREARS','PAYMENT','TERM','WEEK','STAFF','SIBLING','WAIVER','NEW ENROLMENT','GHS','CRITICAL','HIGH','NEAR-FULL','MINOR','REDUCING','CONSISTENT','PARTIAL','GROWING','DOCUMENTED','CASE-BY-CASE','PROPRIETOR','MAX','ONLY','APPLIED','OIC','FEE','BALANCE','ARREAR','DISCOUNT','CREDIT','LUMP','QUARTERLY','MONTHLY','WEEKLY','CASH','MOMO','BANK','CHEQUE','VERIFIED','DATE','RECEIPT','AMOUNT','METHOD','RECEIVED','RUNNING','CUMULATIVE','TARGET','ACTUAL','APR','MAY','JUN','JUL','JAN','FEB','MAR','AUG','SEP','OCT','NOV','DEC','YES','NO','PAID','DUE','NET','RATE','CLASS','PUPIL','NOTES','REMARKS','STATUS','ACTION','REQUIRED','PRIOR','YEAR','JOINER','MID-YEAR','FULLY','SETTLED','COVERED','WEEK','STARTING','ENTRIES','VS','DEADLINE','PAST','WK','WK.','WEEKLY','COLLECTION','SUMMARY','AUTO-CALCULATED','PAYMENT','LOG','RECEIPTS','OPTIONS','BY','TERM.','OF','NUMBER','NO.')
  foreach ($s in $skip) { if ($text -like "*$s*") { return $false } }
  $words = $text -split '\s+' | Where-Object { $_ -ne '' }
  if ($words.Count -lt 2 -or $words.Count -gt 6) { return $false }
  foreach ($w in $words) {
    if ($w -notmatch '^[A-Z][A-Za-z\-\.\'']*$') { return $false }
  }
  return $true
}

$students = @()
for ($si = 3; $si -le 23; $si += 2) {
  if ($si -eq 23) { continue }  # sheet23 is key family groups / summary, not student details
  $sheet = ReadSheet "xl/worksheets/sheet$si.xml"
  if (-not $sheet -or $sheet.maxRow -eq 0) { continue }

  $currentClass = ''
  $currentBirdHouse = ''

  # Map class detail sheets by index (sheets alternate: details, receipts)
  $sheetClassMap = @{
    3  = @{ class = ('Cr' + [char]0x00E8 + 'che'); birdHouse = 'Robins' }
    5  = @{ class = 'Nursery 1'; birdHouse = 'Starlings' }
    7  = @{ class = 'Nursery 2'; birdHouse = 'Goldfinches' }
    9  = @{ class = 'KG 1';      birdHouse = 'Kingfishers' }
    11 = @{ class = 'KG 2';      birdHouse = 'Hawks' }
    13 = @{ class = 'Grade 1';   birdHouse = 'Skylarks' }
    15 = @{ class = 'Grade 2';   birdHouse = 'Kestrels' }
    17 = @{ class = 'Grade 3';   birdHouse = 'Woodpeckers' }
    19 = @{ class = 'Grade 4';   birdHouse = 'Nightingales' }
    21 = @{ class = 'Grade 5';   birdHouse = 'Falcons' }
  }
  if ($sheetClassMap.ContainsKey($si)) {
    $currentClass = $sheetClassMap[$si].class
    $currentBirdHouse = $sheetClassMap[$si].birdHouse
    Write-Host "  Sheet $si -> class=$currentClass house=$currentBirdHouse" -ForegroundColor Green
  }
  Write-Host "Processing sheet$si maxRow=$($sheet.maxRow)" -ForegroundColor Cyan
  for ($r = 1; $r -le $sheet.maxRow; $r++) {
    if (-not $sheet.cells.ContainsKey($r)) { continue }
    $row = $sheet.cells[$r]
    foreach ($col in @('A','B','C','D')) {
      if (-not $row.ContainsKey($col)) { continue }
      $val = $row[$col]
      if (IsLikelyName $val) {
        $students += [ordered]@{
          fullName = $val
          class = $currentClass
          birdHouse = $currentBirdHouse
          sourceSheet = "sheet$si"
        }
      }
    }
  }
}

# ----------------------------------------------------------------
# 4. ARREARS LIST from sheet2 (rows 21-37)
# ----------------------------------------------------------------
$arrearsList = @()
for ($r = 21; $r -le 37; $r++) {
  if (-not $summarySheet.cells.ContainsKey($r)) { continue }
  $row = $summarySheet.cells[$r]
  $name = $row.B
  if ([string]::IsNullOrWhiteSpace($name)) { continue }
  $arrearsList += [ordered]@{
    no = [int]($row.A -as [int])
    pupilName = $name
    arrearsIntoT3 = [double]($row.D -as [double])
    discount = $row.E
    status = $row.F
  }
}

$zip.Dispose()

# ----------------------------------------------------------------
# Save JSON outputs
# ----------------------------------------------------------------
@{
  extractedAt = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
  feeSchedule = $feeSchedule
} | ConvertTo-Json -Depth 10 | Out-File "$OutDir\fee-schedule.json" -Encoding utf8

@{
  extractedAt = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
  fullYearRegister = $fullYearRegister
  totals = $fullYearTotals
} | ConvertTo-Json -Depth 10 | Out-File "$OutDir\full-year-register.json" -Encoding utf8

@{
  extractedAt = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
  count = $students.Count
  students = $students
} | ConvertTo-Json -Depth 10 | Out-File "$OutDir\students.json" -Encoding utf8

@{
  extractedAt = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
  count = $arrearsList.Count
  arrears = $arrearsList
} | ConvertTo-Json -Depth 10 | Out-File "$OutDir\arrears.json" -Encoding utf8

Write-Host "Extraction complete:"
Write-Host "  Fee schedule rows: $($feeSchedule.Count)"
Write-Host "  Full-year register rows: $($fullYearRegister.Count)"
Write-Host "  Student records: $($students.Count)"
Write-Host "  Arrears records: $($arrearsList.Count)"

