# Dokumenty w sekcji Certyfikaty

Aktualny dokument znajduje się w grupie **Fujitsu Solutions → IT Support**:

- `employment-certificate-from-fujitsu.pdf` — oryginalny dokument, skopiowany bez zmian.
- `fujitsu-it-support-confirmation.png` — podgląd pierwszej strony, wyrenderowany z tego PDF.

Wpis potwierdza realizację usług wsparcia IT z ramienia firmy KTA. Jest opisany jako potwierdzenie współpracy, z datą wystawienia i okresem świadczenia usług. Nie jest przedstawiony jako ukończony kurs ani bezpośrednie zatrudnienie przez Fujitsu.

Certyfikat Windows 11 z LinkedIn Learning został usunięty z danych strony oraz z tej paczki projektu. Same źródła rozwoju Mate Academy Polska i LinkedIn Learning zachowują puste miejsca na przyszłe dokumenty.

Dane są przechowywane w `../certificates-data.js`. Wpis dokumentu zawodowego ma `type: "work-confirmation"`, wystawcę, kategorię, tytuł i opis w czterech językach, datę w formacie RRRR-MM-DD, okres współpracy, ścieżkę PDF oraz podglądu. `posterWidth` i `posterHeight` podają rzeczywiste wymiary miniatury. Opcjonalny `issuerLogo` wskazuje lokalne logo wystawcy.

Podgląd działa w oknie dokumentu, a osobny przycisk pobiera oryginalny PDF. Bez obsługi okna podglądu dokument można otworzyć bezpośrednio. Oznaczenie „FUJITSU-RESTRICTED” obecne w metadanych źródłowego PDF pozostaje zachowane.

## Zwijana karta dokumentu

Po otwarciu sekcji Certyfikaty dokument jest domyślnie przedstawiony jako sam tytuł ze strzałką. Kliknięcie lub aktywacja klawiaturą otwiera jego szczegóły, miniaturę, podgląd i pobieranie PDF. Karta korzysta z natywnych elementów `details` i `summary`, a nagłówek kategorii ma dekoracyjny, sześcioramienny asterisk zamiast rombu. Wygląd korzysta z kolorów bieżącego motywu; przy ograniczeniu ruchu animacja rozwijania jest wyłączona.

## Spójna lista źródeł i płynna animacja

Fujitsu Solutions, Mate Academy Polska i LinkedIn Learning korzystają ze wspólnego układu nagłówka, ikony, separatora oraz statusu. Puste źródła nadal są opisane jako „W przygotowaniu”; nie dodano do nich dokumentów.

`certificates-motion.js` odpowiada za animowanie wysokości dokumentu podczas otwierania i zamykania, stopniowe pojawianie się listy oraz dyskretne podświetlenie aktywnego wiersza. Obsługuje zmianę kierunku w trakcie animacji, zmianę szerokości ekranu oraz preferencję ograniczenia ruchu. Bez dostępnej obsługi animacji pozostaje natywne rozwijanie dokumentu.

## Nowy certyfikat i kolejność — 25.10.2026

Dodano otrzymany certyfikat „IT Service Desk: Customer Service Fundamentals with AI” w grupie LinkedIn Learning → IT Support. Oryginalny PDF oraz podgląd pierwszej strony znajdują się w tym folderze. Dotychczasowy dokument Fujitsu pozostaje dostępny; wcześniej usunięty kurs Windows 11 nie został przywrócony.

Wszystkie tytuły są widoczne bez paginacji i domyślnie zwinięte. Wystawca, kategoria tematyczna oraz dokument tworzą hierarchię widoczną również poprzez wcięcie i delikatną linię.

Przycisk „Ustaw kolejność” udostępnia strzałki przestawiania źródeł, a przy kilku certyfikatach w jednej kategorii także strzałki dokumentów. Przyciski obsługują dotyk oraz klawiaturę; dodatkowo Alt + strzałka w górę lub w dół zmienia pozycję aktualnego elementu. Dokumenty pozostają w przypisanej kategorii i źródle. Układ jest zapisywany lokalnie w przeglądarce, wspólnie dla wersji językowych działających pod tym samym adresem witryny. Nie zmienia plików projektu ani układu innych odwiedzających.

Domyślnym motywem witryny jest obecny ciemnoniebieski wariant. Ręcznie wybrany jasny motyw nadal jest pamiętany. Opcjonalny efekt elektryczny źródeł jest przypisany do zaokrąglonego panelu treści, z błyskiem śledzącym jego faktyczną krawędź.
