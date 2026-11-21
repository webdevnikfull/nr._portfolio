# IT Security Checkup

Uruchom START.cmd na komputerze z Windows i Node.js 20 lub nowszym. Otworzy się lokalny panel. Okno uruchomienia pozostaw otwarte podczas monitorowania. Zakończenie przez Ctrl+C zatrzymuje serwer i odczyt danych.

Monitor urządzenia odczytuje rzeczywiste liczniki interfejsów Windows. Prędkość odbierania i wysyłania powstaje z różnicy dwóch kolejnych odczytów. Lista interfejsów pozwala wybrać połączenie. Systemowe połączenia TCP i porty nasłuchujące pojawiają się, gdy system udostępnia te dane. Brak dostępu lub brak próbki daje pusty stan pomiaru.

Panel jest dostępny lokalnie pod adresem http://127.0.0.1:4173. Serwer akceptuje lokalne żądania. Dane sieci pozostają w pamięci procesu. Eksport zapisuje plik na urządzeniu użytkownika. Wybrany interfejs może obejmować ruch wielu aplikacji. Odczyt jest pasywny i obejmuje liczniki oraz metadane połączeń.

Projekt działa też jako statyczna strona na hostingu. Wtedy monitor przeglądarkowy pokazuje rzeczywiste żądania tej strony, raportowany transfer i próby HTTP do jej serwera. Dostęp do liczników urządzenia odwiedzającego wymaga uruchomienia lokalnego modułu na jego komputerze. Wielkości zasobów między domenami zależą od udostępniania Resource Timing. Odpowiedź HTTP oznacza czas pełnej próby HTTP, łącznie z pobraniem małego pliku kontrolnego. Zegar i znaczniki czasu używają strefy czasowej przeglądarki.

Urządzenia, użytkownicy, MFA i polityki dostępu są lokalnym scenariuszem ćwiczeniowym. Zmiany, notatki i dziennik działań zapisują się w tej przeglądarce. Te moduły ilustrują procesy zgodności urządzeń oraz dostępu warunkowego inspirowane Intune i Entra. Ocena dostępu uwzględnia włączenie konta, ryzyko, zgodność urządzenia i MFA. Niezaufana sieć w tym scenariuszu wymaga MFA. Stary postęp sześciopunktowej listy kontrolnej jest przenoszony przy pierwszym uruchomieniu.

Języki interfejsu to angielski, polski, niemiecki, hiszpański, francuski, ukraiński i rosyjski. Motyw jasny i ciemny zmienia wygląd interfejsu.

## Local preview

Run START.cmd on Windows with Node.js 20 or later, or run `node server.mjs`. Open http://127.0.0.1:4173. Press Ctrl+C to stop. An optional PORT environment variable selects another port. The local Windows monitor reads real adapter counters and available TCP metadata. Hosted copies measure their own page traffic. Device, identity and policy actions are clearly marked local training data. Measurements never use randomly generated traffic values.

## Technical references

- [Microsoft Intune device compliance](https://learn.microsoft.com/en-us/intune/device-security/compliance/overview)
- [Microsoft Entra Conditional Access](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview)
- [Resource Timing transfer sizes](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize)
- [NetworkInterface.GetIPStatistics](https://learn.microsoft.com/en-us/dotnet/api/system.net.networkinformation.networkinterface.getipstatistics)
