# NR. IT Workspace — GitHub Pages

Wgraj zawartość tego folderu do repozytorium. Następnie w GitHub wybierz Settings → Pages → Deploy from a branch → main → /(root).

Trzy połączone narzędzia są dostępne w jednej aplikacji:
- `#desk` — Support Desk: zgłoszenia, priorytety i historia rozwiązania.
- `#monitor` — Service Monitor: przykładowe obserwacje i ręczne przełączanie stanów usług.
- `#assets` — Asset Manager: rejestr sprzętu, zmiana stanu urządzeń i etykiety QR.

To interaktywne demo. Zmiany są zapisywane lokalnie w przeglądarce. Na ekranie głównym cztery karty przełączają podgląd otwartych zgłoszeń, urządzeń, usług i rozwiązanych zgłoszeń. W Support Desk karty filtrują zgłoszenia według stanu, a rozwijana lista pozwala również wyświetlić wszystkie zgłoszenia lub połączyć rozwiązane z zamkniętymi. Stan usług możesz przełączać między „Działa”, „Niedostępne” i „Niepotwierdzone”; stan urządzeń między „Aktywne”, „Serwis” i „Wycofane”. Cztery karty nad listą urządzeń służą do filtrowania widoku według tych stanów; ponowne wybranie „Urządzenia” pokazuje wszystkie. Dane monitoringu są przykładowe, a nie wynikiem rzeczywistego sprawdzenia sieci.

W górnym pasku wybierzesz jeden z siedmiu języków (PL, EN, DE, ES, FR, UK, RU) i motyw jasny lub ciemny. Oba ustawienia są zapisywane lokalnie. Dane demo można przywrócić przyciskiem w stopce. Kody QR prowadzą do kart urządzeń; nowo dodane urządzenia demo istnieją tylko na urządzeniu, na którym je zapisano.

Autor: Nikita Rysiev. Biblioteka QR: qrcode-generator, licencja w vendor/LICENSE.txt.
