@echo off
echo JLPT 모니터링 시작...
node headless.js --regions=15 --level=N2 --interval=15 --year=2025 --times=2 --cookie="PHPSESSID=catpoa3cvsv1eenbqmncpkelje; nowdays=read_2025-09-19; pop=NO" --telegram-token="8078482638:AAFJDMfo-UaKj1-AaJAsAvolEtBic_PTDS0" --telegram-chat="6632560721"
pause
