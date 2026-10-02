Get-Content .env | Where-Object { $_ -match '^([^#][^=]+)=(.*)$' } | ForEach-Object {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
}
$env:PORT = "8085"
mvn spring-boot:run
