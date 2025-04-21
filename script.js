document.addEventListener('DOMContentLoaded', () => {
    // --- Elementy DOM ---
    const navLinks = document.querySelectorAll('nav a');
    const contentSections = document.querySelectorAll('.content-section');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const yourNotesList = document.getElementById('your-notes-list');
    const clearNotesBtn = document.getElementById('clear-notes-btn');
    const contentArea = document.getElementById('content-area');
    const schoolTokFeed = document.getElementById('school-tok-feed');
    const modal = document.getElementById('post-modal');
    const modalContent = document.getElementById('modal-post-content');
    const closeModalBtn = modal.querySelector('.close-btn');

    // --- Zmienne Globalne ---
    const NOTES_STORAGE_KEY = 'duckyEduNotes';
    let currentFilter = 'all'; // Przechowuje aktywny filtr dla bieżącej sekcji

    // =========================================
    // Nawigacja i Zarządzanie Sekcjami
    // =========================================

    function setActiveSection(targetId) {
        // Ukryj wszystkie sekcje i deaktywuj linki
        contentSections.forEach(section => section.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        const targetSection = document.getElementById(targetId);
        const targetLink = document.querySelector(`nav a[href="#${targetId}"]`);

        if (targetSection) {
            targetSection.classList.add('active');
            // Resetuj filtr przedmiotów do 'all' przy zmianie sekcji
            resetSubjectFilter(targetSection);

            // Wywołaj funkcje specyficzne dla aktywowanej sekcji
            if (targetId === 'your-notes') {
                loadNotesFromLocalStorage();
            } else if (targetId === 'school-tok') {
                populateSchoolTok(); // Wypełnij School Tok
            } else if (targetSection.querySelector('.filter-bar')) {
                // Zastosuj domyślny filtr 'all' i animuj posty
                filterPosts(targetSection, 'all', true); // true - to inicjalizacja
            } else {
                // Dla sekcji bez filtrów (np. Ciekawostki, Wskazówki) - po prostu animuj
                animateVisiblePosts(targetSection);
            }
        }

        // Aktywuj kliknięty link w nawigacji
        if (targetLink) {
            targetLink.classList.add('active');
        }

        // Resetuj pole wyszukiwania i przewiń do góry
        resetSearch();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Event Listenery dla linków nawigacji
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const linkId = link.id;
            const targetHref = link.getAttribute('href');

            if (linkId === 'nav-search-link') {
                e.preventDefault();
                searchInput.focus(); // Skup się na wyszukiwarce
            } else if (targetHref && targetHref.startsWith('#')) {
                e.preventDefault(); // Zapobiegaj domyślnej akcji kotwicy
                const targetId = targetHref.substring(1);
                setActiveSection(targetId); // Zmień aktywną sekcję
            }
        });
    });

    // Ustawienie początkowej sekcji po załadowaniu strony
    setActiveSection('recommended');

    // =========================================
    // Animacja Postów
    // =========================================

    function animateVisiblePosts(section) {
        if (!section || section.id === 'school-tok') return; // Pomijamy School Tok

        // Znajdź wszystkie posty w sekcji, które są aktualnie widoczne (display != 'none')
        // i nie mają jeszcze klasy 'visible'
        const postsToAnimate = section.querySelectorAll('.post:not(.visible)');

        postsToAnimate.forEach((post, index) => {
             // Sprawdźmy styl display bezpośrednio, bo .visible może zostać usunięte
            if (window.getComputedStyle(post).display !== 'none') {
                // Dodaj opóźnienie dla efektu kaskadowego
                post.style.transitionDelay = `${index * 0.07}s`; // Można dostosować opóźnienie

                // Używamy minimalnego timeout, aby przeglądarka zdążyła zastosować display: block
                // przed dodaniem klasy 'visible' inicjującej transition.
                setTimeout(() => {
                    post.classList.add('visible');
                }, 10);
            }
        });
    }


    // =========================================
    // Filtrowanie Przedmiotów
    // =========================================

    function filterPosts(section, subject, isInitialLoad = false) {
        if (!section) return;
        const posts = section.querySelectorAll('article.post[data-subject]'); // Tylko posty z atrybutem
        const filterButtons = section.querySelectorAll('.filter-btn');
        currentFilter = subject; // Zaktualizuj globalny filtr dla sekcji

        // Aktualizacja wyglądu przycisków filtra
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subject === subject);
        });

        // Pokaż/ukryj posty
        posts.forEach(post => {
            const postSubject = post.dataset.subject;
            const shouldBeVisible = (subject === 'all' || postSubject === subject);

            // Najpierw usuwamy klasę .visible i resetujemy opóźnienie
            post.classList.remove('visible');
            post.style.transitionDelay = '0s';

            if (shouldBeVisible) {
                post.style.display = 'block'; // Ustaw widoczność
            } else {
                post.style.display = 'none'; // Ukryj
            }
        });

        // Wywołaj animację dla teraz widocznych postów (z małym opóźnieniem, by style się zastosowały)
        setTimeout(() => {
             animateVisiblePosts(section);
        }, isInitialLoad ? 50 : 100); // Dłuższe opóźnienie przy pierwszej zmianie sekcji
    }

    // Resetuje filtr do "Wszystkie" w danej sekcji
    function resetSubjectFilter(section) {
        if (!section) return;
        const filterButtons = section.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subject === 'all');
        });
        currentFilter = 'all'; // Reset globalnego filtra
    }

    // =========================================
    // Wyszukiwanie
    // =========================================

    function resetSearch() {
        searchInput.value = ''; // Wyczyść pole wyszukiwania
        // Przywróć widoczność postów zgodnie z aktywnym filtrem w aktywnej sekcji
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection && activeSection.querySelector('.filter-bar')) {
            const activeFilterButton = activeSection.querySelector('.filter-btn.active');
            const filter = activeFilterButton ? activeFilterButton.dataset.subject : 'all';
            filterPosts(activeSection, filter); // Zastosuj ponownie filtr
        } else if (activeSection) {
            // Dla sekcji bez filtrów, po prostu pokaż wszystkie i animuj
            activeSection.querySelectorAll('.post').forEach(post => {
                post.classList.remove('visible');
                post.style.display = 'block';
            });
            animateVisiblePosts(activeSection);
        }
    }

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const activeSection = document.querySelector('.content-section.active');

        if (!activeSection) return; // Nic nie rób, jeśli żadna sekcja nie jest aktywna

        // Jeśli pole jest puste, resetuj widok
        if (searchTerm === '') {
            resetSearch();
            return;
        }

        const postsInSection = activeSection.querySelectorAll('article.post');
        let foundResults = false;

        postsInSection.forEach(post => {
            // Sprawdź, czy post pasuje do AKTYWNEGO FILTRA (jeśli sekcja ma filtry)
            const hasFilters = activeSection.querySelector('.filter-bar');
            const postSubject = post.dataset.subject;
            // Jeśli są filtry, post musi pasować do currentFilter lub currentFilter musi być 'all'
            // Jeśli nie ma filtrów, post zawsze "pasuje" do filtra.
            const filterAllows = !hasFilters || (currentFilter === 'all' || postSubject === currentFilter);

            // Sprawdź, czy tekst pasuje
            const descriptionElement = post.querySelector('.description');
            let textMatch = false;
            if (descriptionElement) {
                textMatch = descriptionElement.textContent.toLowerCase().includes(searchTerm);
            }

            // Usuń 'visible' przed zmianą display, aby uniknąć konfliktów animacji
            post.classList.remove('visible');
            post.style.transitionDelay = '0s';

            // Pokaż post, jeśli pasuje do filtra ORAZ do wyszukiwania
            if (filterAllows && textMatch) {
                post.style.display = 'block';
                foundResults = true;
            } else {
                post.style.display = 'none';
            }
        });

        // Animuj widoczne wyniki wyszukiwania
        animateVisiblePosts(activeSection);

        // Można dodać komunikat o braku wyników, jeśli foundResults === false
        console.log(foundResults ? "Znaleziono wyniki." : "Brak wyników dla tego filtra i wyszukiwania.");
    }

    // Event Listenery dla wyszukiwania
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        } else if (e.key === 'Escape') {
            resetSearch(); // Resetuj na Escape
        }
        // Opcjonalne wyszukiwanie "na żywo" - może wymagać optymalizacji (debounce)
        // performSearch();
    });
    // Resetuj wyszukiwanie również gdy użytkownik wyczyści pole i kliknie gdzie indziej
    searchInput.addEventListener('input', () => {
         if (searchInput.value.trim() === '') {
             resetSearch();
         }
     });

    // =========================================
    // Zarządzanie Notatkami (Local Storage)
    // =========================================

    function getNotesFromLocalStorage() {
        const notesJson = localStorage.getItem(NOTES_STORAGE_KEY);
        try {
            return notesJson ? JSON.parse(notesJson) : [];
        } catch (e) {
            console.error("Błąd odczytu notatek z Local Storage:", e);
            return [];
        }
    }

    function saveNotesToLocalStorage(notes) {
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    }

    function displayNotes() {
        const notes = getNotesFromLocalStorage();
        yourNotesList.innerHTML = ''; // Wyczyść kontener

        if (notes.length === 0) {
            yourNotesList.innerHTML = '<p>Nie masz jeszcze zapisanych żadnych notatek.</p>';
        } else {
            notes.forEach((noteText, index) => {
                const noteElement = document.createElement('div');
                noteElement.classList.add('your-note-item');
                noteElement.innerHTML = `
                    <p>${escapeHTML(noteText)}</p> <!-- Zabezpieczenie przed XSS -->
                    <button class="delete-note-btn" data-index="${index}" title="Usuń tę notatkę">
                       <i class="fas fa-trash-alt"></i>
                    </button>
                `;
                yourNotesList.appendChild(noteElement);
            });
            // Dodajemy listenery do przycisków usuwania PO wygenerowaniu listy
            addDeleteButtonListeners();
        }
    }

    // Funkcja pomocnicza do zabezpieczenia przed prostym XSS
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }


    function addDeleteButtonListeners() {
        // Używamy delegacji zdarzeń na kontenerze listy notatek
        yourNotesList.addEventListener('click', handleDeleteNoteClick);
    }
    // Handler dla kliknięć wewnątrz listy notatek (do usuwania)
    function handleDeleteNoteClick(e) {
         const deleteButton = e.target.closest('.delete-note-btn');
         if (deleteButton) {
             const indexToDelete = parseInt(deleteButton.dataset.index, 10);
             if (!isNaN(indexToDelete)) {
                  deleteNote(indexToDelete);
             }
         }
     }


    function addNote(noteText) {
        if (!noteText || noteText.trim() === '') return; // Ignoruj puste notatki

        const notes = getNotesFromLocalStorage();
        const trimmedNote = noteText.trim();

        if (!notes.includes(trimmedNote)) {
            notes.push(trimmedNote);
            saveNotesToLocalStorage(notes);
            // Odśwież widok tylko jeśli sekcja "Twoje Notatki" jest aktywna
            if (document.getElementById('your-notes').classList.contains('active')) {
                displayNotes();
            }
            showFeedback('Notatka zapisana!');
        } else {
            showFeedback('Ta notatka już istnieje!', 'warning');
        }
    }

    function deleteNote(index) {
        let notes = getNotesFromLocalStorage();
        if (index >= 0 && index < notes.length) {
            notes.splice(index, 1); // Usuń element z tablicy
            saveNotesToLocalStorage(notes);
            displayNotes(); // Odśwież widok listy
        }
    }

    function loadNotesFromLocalStorage() {
        displayNotes(); // Wyświetl notatki przy wejściu do sekcji
    }

    // Listener dla przycisku "Wyczyść wszystkie"
    clearNotesBtn.addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz usunąć WSZYSTKIE zapisane notatki? Tej operacji nie można cofnąć.')) {
            localStorage.removeItem(NOTES_STORAGE_KEY);
            loadNotesFromLocalStorage(); // Odśwież widok (pokaże pustą listę)
            showFeedback('Wszystkie notatki usunięte.', 'warning');
        }
    });


    // =========================================
    // Powiadomienia dla Użytkownika
    // =========================================

    function showFeedback(message, type = 'success') {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `feedback-popup ${type}`;
        feedbackDiv.textContent = message;
        document.body.appendChild(feedbackDiv);

        // Pokaż popup
        setTimeout(() => feedbackDiv.classList.add('visible'), 50);

        // Ukryj i usuń popup po pewnym czasie
        setTimeout(() => {
            feedbackDiv.classList.remove('visible');
            // Usuń element z DOM po zakończeniu animacji znikania
            feedbackDiv.addEventListener('transitionend', () => feedbackDiv.remove(), { once: true });
        }, 2500); // Czas wyświetlania (2.5 sekundy)
    }

    // =========================================
    // Logika Modala (Okno dialogowe)
    // =========================================

    function openModal(postElement) {
        modalContent.innerHTML = ''; // Wyczyść poprzednią zawartość

        const image = postElement.querySelector('img');
        const description = postElement.querySelector('.description');
        const funFactIcon = postElement.querySelector('.fun-fact-icon');

        if (image) {
            const clonedImage = image.cloneNode(true);
            modalContent.appendChild(clonedImage);
        } else if (funFactIcon) {
            const clonedIcon = funFactIcon.cloneNode(true);
            modalContent.appendChild(clonedIcon);
        }

        if (description) {
            const clonedDescription = description.cloneNode(true);
            // Używamy innerHTML, aby zachować formatowanie <strong>
            clonedDescription.innerHTML = description.innerHTML;
            modalContent.appendChild(clonedDescription);
        } else {
            // Dodaj placeholder, jeśli nie ma opisu
            modalContent.insertAdjacentHTML('beforeend', '<p>Brak dodatkowych informacji.</p>');
        }

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Zablokuj przewijanie tła
    }

    function closeModal() {
        modal.classList.add('fade-out');
        modal.addEventListener('animationend', () => {
            modal.style.display = 'none';
            modal.classList.remove('fade-out');
            document.body.style.overflow = ''; // Przywróć przewijanie tła
        }, { once: true });
    }

    // Listenery zamykania modala
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) { // Kliknięcie na tło (poza modal-content)
            closeModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // =========================================
    // Logika School Tok
    // =========================================

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function populateSchoolTok() {
        schoolTokFeed.innerHTML = '<p class="loading-placeholder">Mieszam posty dla Ciebie...</p>';

        // Zbierz WSZYSTKIE posty z atrybutem data-subject z sekcji filtrowalnych
        const allPosts = document.querySelectorAll('.content-section:not(#school-tok):not(#your-notes) .post[data-subject]');
        const postsToShuffle = Array.from(allPosts); // Konwersja NodeList na Array

        if (postsToShuffle.length === 0) {
            schoolTokFeed.innerHTML = '<p class="loading-placeholder">Ups! Wygląda na to, że nie ma jeszcze żadnych postów.</p>';
            return;
        }

        const shuffledPosts = shuffleArray(postsToShuffle);

        // Wyczyść kontener przed dodaniem nowych postów
        schoolTokFeed.innerHTML = '';

        shuffledPosts.forEach(originalPost => {
            // Klonujemy post, aby nie modyfikować oryginału
            const clonedPost = originalPost.cloneNode(true);
            // Usuń klasy i style związane z animacją pojawiania się
            clonedPost.classList.remove('visible');
            clonedPost.style.opacity = '1'; // Od razu widoczne w School Tok
            clonedPost.style.transform = 'none';
            clonedPost.style.transition = 'none'; // Bez transition w School Tok
             clonedPost.style.display = 'flex'; // Upewnij się, że jest flex

            // Dodaj klon do School Tok feed
            schoolTokFeed.appendChild(clonedPost);
        });
         // Przewiń feed na samą górę po załadowaniu
         schoolTokFeed.scrollTop = 0;
    }

    // =========================================
    // Główna Delegacja Zdarzeń
    // =========================================

    contentArea.addEventListener('click', (e) => {
        const target = e.target;

        // 1. Obsługa kliknięcia przycisku filtra
        if (target.classList.contains('filter-btn')) {
            const subject = target.dataset.subject;
            const section = target.closest('.content-section');
            if (section) {
                filterPosts(section, subject);
            }
            return; // Zakończ obsługę, bo to była akcja filtra
        }

        // 2. Obsługa kliknięcia przycisku "Zapisz notatkę"
        const clickedSaveButton = target.closest('.save-note-btn');
        if (clickedSaveButton) {
            const contentToSave = clickedSaveButton.dataset.content;
            addNote(contentToSave);
            return; // Zakończ obsługę
        }

        // 3. Obsługa kliknięcia w post (aby otworzyć modal)
        const clickedPost = target.closest('.post.clickable');
        if (clickedPost) {
             // Sprawdź, czy kliknięcie nie było na przycisku wewnątrz posta (już obsłużone wyżej)
             // Sprawdź, czy post nie jest wewnątrz School Tok
             if (!target.closest('.save-note-btn') && !clickedPost.closest('#school-tok-feed')) {
                  openModal(clickedPost);
             }
        }
    });

     // Dodaj listener do usuwania notatek (już dodany w displayNotes przez addDeleteButtonListeners)
     // Ale upewnijmy się, że jest dodany na początku
     addDeleteButtonListeners();


}); // Koniec DOMContentLoaded