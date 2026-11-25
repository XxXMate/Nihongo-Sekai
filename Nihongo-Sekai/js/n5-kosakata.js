
document.addEventListener("DOMContentLoaded", () => {

  /* =====================================================
     1. PENGATURAN DASAR
  ===================================================== */

  const groupGrid = document.querySelector(".vocab-group-grid");

  if (!groupGrid) return;

  const groupCards = Array.from(
    groupGrid.querySelectorAll(".vocab-group-card")
  );

  if (!groupCards.length) return;

  let activePanel = null;
  let activeCard = null;


  /* =====================================================
     2. MEMUAT DATA KOSAKATA DARI FILE JSON
     SUMBER: assets/data/n5-kosakata.json
  ===================================================== */

  async function loadVocabularyData() {

    try {

      const response = await fetch("assets/data/n5-kosakata.json");

      if (!response.ok) {
        throw new Error(`Gagal memuat data: ${response.status}`);
      }

      const data = await response.json();

      initializeGroups(data.groups || []);

    } catch (error) {

      console.error("Kesalahan memuat kosakata:", error);

      groupCards.forEach(card => {
        card.setAttribute("aria-disabled", "true");
      });

      const errorMessage = document.createElement("p");

      errorMessage.className = "vocab-empty-message";

      errorMessage.textContent =
        "Data kosakata belum dapat dimuat. Periksa file JSON dan jalankan website melalui server.";

      groupGrid.appendChild(errorMessage);

    }

  }


  /* =====================================================
     3. MENGHUBUNGKAN DATA JSON DENGAN KARTU HTML
  ===================================================== */

  function initializeGroups(groups) {

    groupCards.forEach((card, index) => {

      const groupNumber = index + 1;

      const group = groups.find(
        item => item.number === groupNumber
      ) || {
        number: groupNumber,
        subgroups: []
      };

      const title =
        card.querySelector("h3")?.textContent.trim() ||
        `Kelompok ${groupNumber}`;

      const description =
        card.querySelector("p")?.textContent.trim() || "";

      group.title = title;
      group.description = description;

      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-expanded", "false");

      card.setAttribute(
        "aria-controls",
        `vocab-group-panel-${groupNumber}`
      );


      /* KLIK KARTU KELOMPOK */

      card.addEventListener("click", () => {
        toggleGroup(card, group, index);
      });


      /* KEYBOARD: ENTER DAN SPASI */

      card.addEventListener("keydown", event => {

        if (event.key === "Enter" || event.key === " ") {

          event.preventDefault();

          toggleGroup(card, group, index);

        }

      });

    });

  }


  /* =====================================================
     4. MEMBUKA DAN MENUTUP KELOMPOK
     PANEL LAMA DIHAPUS AGAR TIDAK MENUMPUK
  ===================================================== */

  function toggleGroup(card, group, groupIndex) {

    /* KARTU YANG SAMA DIKLIK LAGI: TUTUP */

    if (activeCard === card && activePanel) {

      closeActivePanel();

      return;

    }


    /* TUTUP PANEL SEBELUMNYA */

    closeActivePanel();


    /* BUAT PANEL BARU */

    const newPanel = createGroupPanel(group, groupIndex);


    /* PANEL MUNCUL TEPAT DI BAWAH KARTU */

    card.insertAdjacentElement("afterend", newPanel);

    newPanel.hidden = false;

    card.setAttribute("aria-expanded", "true");

    activePanel = newPanel;
    activeCard = card;


    /* SCROLL KE PANEL SAAT DIBUKA */

    newPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }


  /* =====================================================
     5. FUNGSI MENUTUP PANEL AKTIF
     TANPA SCROLL OTOMATIS
  ===================================================== */

  function closeActivePanel() {

    if (activePanel) {

      activePanel.remove();

    }

    if (activeCard) {

      activeCard.setAttribute(
        "aria-expanded",
        "false"
      );

    }

    activePanel = null;
    activeCard = null;

  }


  /* =====================================================
     6. MEMBUAT PANEL DETAIL KELOMPOK
  ===================================================== */

  function createGroupPanel(group, groupIndex) {

    const panel = document.createElement("section");

    panel.className = "vocab-group-detail";

    panel.id = `vocab-group-panel-${group.number}`;

    panel.hidden = true;

    panel.innerHTML = `

      <div class="vocab-detail-heading">

        <div>

          <span class="vocab-detail-number">
            KELOMPOK ${group.number}
          </span>

          <h2>${group.title}</h2>

          <p>${group.description}</p>

        </div>

        <button
          type="button"
          class="vocab-close-button"
          aria-label="Tutup kelompok ${group.number}"
        >
          Tutup ✕
        </button>

      </div>

      <div class="vocab-subgroup-list"></div>

    `;

    const subgroupList = panel.querySelector(
      ".vocab-subgroup-list"
    );


    /* =================================================
       7. PESAN JIKA MATERI BELUM TERSEDIA
    ================================================= */

    if (!group.subgroups || !group.subgroups.length) {

      subgroupList.innerHTML = `

        <div class="vocab-empty-message">

          <p>
            Materi kelompok ini sedang disiapkan.
          </p>

          <p>
            Silakan pelajari kelompok lainnya terlebih dahulu.
          </p>

        </div>

      `;

    }


    /* =================================================
       8. MEMBUAT DAFTAR SUBKELOMPOK
    ================================================= */

    (group.subgroups || []).forEach(
      (subgroup, subgroupIndex) => {

        const subgroupElement = document.createElement("article");

        subgroupElement.className = "vocab-subgroup";

        subgroupElement.innerHTML = `

          <button
            type="button"
            class="vocab-subgroup-toggle"
            aria-expanded="false"
          >

            <span class="vocab-subgroup-name">

              <span class="vocab-subgroup-number">
                ${subgroup.number}
              </span>

              ${subgroup.title}

            </span>

            <span class="vocab-subgroup-arrow">
              ⌄
            </span>

          </button>

          <div class="vocab-subgroup-content" hidden>

            <div class="vocab-inner-tab-list" hidden></div>

            <div class="vocab-inner-tab-panels"></div>

          </div>

        `;

        const tabList = subgroupElement.querySelector(
          ".vocab-inner-tab-list"
        );

        const tabPanels = subgroupElement.querySelector(
          ".vocab-inner-tab-panels"
        );


        /* =================================================
           9. FUNGSI MEMBUAT DAFTAR KOSAKATA
           DIGUNAKAN OLEH TAB DAN SUBKELOMPOK BIASA
        ================================================= */

        function renderWordList(words, target, tabIndex = 0) {

          const wordList = document.createElement("div");

          wordList.className = "vocab-word-list";

          (words || []).forEach((word, wordIndex) => {

            const wordElement = document.createElement("div");

            wordElement.className = "vocab-word-item";

            const detailId =
              `vocab-detail-${groupIndex}-${subgroupIndex}-${tabIndex}-${wordIndex}`;

            const label = word.label || "Umum";

            const labelClass = label.toLowerCase();

            wordElement.innerHTML = `

              <button
                type="button"
                class="vocab-word-toggle"
                aria-expanded="false"
                aria-controls="${detailId}"
              >

                <span class="vocab-word-japanese">
                  ${word.jp}
                </span>

                <span class="vocab-word-label label-${labelClass}">
                  ${label}
                </span>

                <span class="vocab-word-arrow">
                  ＋
                </span>

              </button>


              <div
                class="vocab-word-detail"
                id="${detailId}"
                hidden
              >

                <p class="vocab-word-romaji">
                  ${word.romaji || ""}
                </p>

                <p class="vocab-word-meaning">
                  <strong>Arti:</strong> ${word.meaning || ""}
                </p>

                ${
                  word.note
                    ? `
                      <p class="vocab-word-note">
                        ${word.note}
                      </p>
                    `
                    : ""
                }

                ${
                  word.example
                    ? `
                      <div class="vocab-example">

                        <p>
                          <strong>Contoh kalimat:</strong>
                        </p>

                        <p class="vocab-example-jp">
                          ${word.example}
                        </p>

                        ${
                          word.exampleRomaji
                            ? `
                              <p class="vocab-example-romaji">
                                ${word.exampleRomaji}
                              </p>
                            `
                            : ""
                        }

                        <p class="vocab-example-id">
                          ${word.translation || ""}
                        </p>

                      </div>
                    `
                    : ""
                }

                <button
                  type="button"
                  class="vocab-audio-button"
                >
                  🔊 Dengarkan Pelafalan
                </button>

              </div>

            `;


            /* BUKA DAN TUTUP DETAIL KOSAKATA */

            const wordToggle = wordElement.querySelector(
              ".vocab-word-toggle"
            );

            const wordDetail = wordElement.querySelector(
              ".vocab-word-detail"
            );

            const wordArrow = wordElement.querySelector(
              ".vocab-word-arrow"
            );


            wordToggle.addEventListener("click", () => {

              const shouldOpen = wordDetail.hidden;

              wordDetail.hidden = !shouldOpen;

              wordToggle.setAttribute(
                "aria-expanded",
                String(shouldOpen)
              );

              wordArrow.textContent =
                shouldOpen ? "−" : "＋";

            });


            /* AUDIO KOSAKATA */

            const audioButton = wordElement.querySelector(
              ".vocab-audio-button"
            );

            audioButton.addEventListener("click", () => {

              speakJapanese(word.audio || word.jp);

            });


            wordList.appendChild(wordElement);

          });

          target.appendChild(wordList);

        }


        /* =================================================
           9A. MENAMPILKAN CATATAN DARI JSON - BARU

           JS HANYA MEMBACA DATA.
           ISI CATATAN TIDAK DISIMPAN DI FILE JS.
        ================================================= */

        function renderPronunciationNote(note, target) {

          if (!note) return;

          const noteContainer = document.createElement("section");

          noteContainer.className = "vocab-pronunciation-note";


          /* JUDUL CATATAN */

          if (note.title) {

            const noteTitle = document.createElement("h3");

            noteTitle.className = "vocab-pronunciation-title";

            noteTitle.textContent = note.title;

            noteContainer.appendChild(noteTitle);

          }


          /* KALIMAT PEMBUKA */

          if (note.intro) {

            const noteIntro = document.createElement("p");

            noteIntro.className = "vocab-pronunciation-intro";

            noteIntro.textContent = note.intro;

            noteContainer.appendChild(noteIntro);

          }


          /* TABEL PELAFALAN */

          if (Array.isArray(note.items) && note.items.length) {

            const tableWrapper = document.createElement("div");

            tableWrapper.className =
              "vocab-pronunciation-table-wrapper";


            const table = document.createElement("table");

            table.className = "vocab-pronunciation-table";


            const tableHead = document.createElement("thead");

            tableHead.innerHTML = `
              <tr>
                <th>Angka</th>
                <th>Bahasa Jepang</th>
                <th>Romaji</th>
              </tr>
            `;


            const tableBody = document.createElement("tbody");


            note.items.forEach(item => {

              const row = document.createElement("tr");

              const numberCell = document.createElement("td");

              const japaneseCell = document.createElement("td");

              const romajiCell = document.createElement("td");


              numberCell.textContent = item.number || "";

              japaneseCell.textContent = item.japanese || "";

              romajiCell.textContent = item.romaji || "";


              row.appendChild(numberCell);

              row.appendChild(japaneseCell);

              row.appendChild(romajiCell);


              tableBody.appendChild(row);

            });


            table.appendChild(tableHead);

            table.appendChild(tableBody);

            tableWrapper.appendChild(table);

            noteContainer.appendChild(tableWrapper);

          }


          /* CATATAN PENUTUP */

          if (note.footer) {

            const noteFooter = document.createElement("p");

            noteFooter.className = "vocab-pronunciation-footer";

            noteFooter.textContent = note.footer;

            noteContainer.appendChild(noteFooter);

          }


          target.appendChild(noteContainer);

        }


        /* =================================================
           9B. SUBKELOMPOK YANG MEMILIKI TAB
           CONTOH: KELOMPOK 3.2
        ================================================= */

        if (Array.isArray(subgroup.tabs) && subgroup.tabs.length) {

          tabList.hidden = false;

          subgroup.tabs.forEach((tab, tabIndex) => {

            /* TOMBOL TAB */

            const tabButton = document.createElement("button");

            tabButton.type = "button";

            tabButton.className = "vocab-inner-tab";

            tabButton.textContent = tab.title;

            tabButton.setAttribute(
              "aria-selected",
              "false"
            );


            /* PANEL ISI TAB */

            const tabPanel = document.createElement("div");

            tabPanel.className = "vocab-inner-tab-panel";

            tabPanel.hidden = true;


            /* DAFTAR KOSAKATA */

            renderWordList(
              tab.words || [],
              tabPanel,
              tabIndex
            );


            /* CATATAN HANYA DITAMPILKAN JIKA ADA DI JSON */

            if (
              String(subgroup.number) === "3.2" &&
              tab.title === "Angka Besar" &&
              tab.note
            ) {

              renderPronunciationNote(
                tab.note,
                tabPanel
              );

            }


            /* KLIK TAB */

            tabButton.addEventListener("click", () => {

              tabList.querySelectorAll(
                ".vocab-inner-tab"
              ).forEach(button => {

                button.classList.remove("active");

                button.setAttribute(
                  "aria-selected",
                  "false"
                );

              });


              tabPanels.querySelectorAll(
                ".vocab-inner-tab-panel"
              ).forEach(content => {

                content.hidden = true;

              });


              /* AKTIFKAN TAB YANG DIPILIH */

              tabButton.classList.add("active");

              tabButton.setAttribute(
                "aria-selected",
                "true"
              );

              tabPanel.hidden = false;

            });


            tabList.appendChild(tabButton);

            tabPanels.appendChild(tabPanel);


            /* TAB PERTAMA LANGSUNG AKTIF */

            if (tabIndex === 0) {

              tabButton.classList.add("active");

              tabButton.setAttribute(
                "aria-selected",
                "true"
              );

              tabPanel.hidden = false;

            }

          });

        } else {

          /* =================================================
             9C. SUBKELOMPOK BIASA TANPA TAB
             CONTOH: 3.1, 3.3, 3.4, DAN 3.5
          ================================================= */

          renderWordList(
            subgroup.words || [],
            tabPanels
          );

        }


        /* =================================================
           10. BUKA DAN TUTUP SUBKELOMPOK
        ================================================= */

        const subgroupToggle = subgroupElement.querySelector(
          ".vocab-subgroup-toggle"
        );

        const subgroupContent = subgroupElement.querySelector(
          ".vocab-subgroup-content"
        );

        const subgroupArrow = subgroupElement.querySelector(
          ".vocab-subgroup-arrow"
        );


        subgroupToggle.addEventListener("click", () => {

          const shouldOpen = subgroupContent.hidden;


          /* TUTUP SUBKELOMPOK LAIN */

          subgroupList.querySelectorAll(
            ".vocab-subgroup-content"
          ).forEach(content => {

            content.hidden = true;

          });


          subgroupList.querySelectorAll(
            ".vocab-subgroup-toggle"
          ).forEach(button => {

            button.setAttribute(
              "aria-expanded",
              "false"
            );

          });


          subgroupList.querySelectorAll(
            ".vocab-subgroup-arrow"
          ).forEach(arrow => {

            arrow.textContent = "⌄";

          });


          /* BUKA SUBKELOMPOK YANG DIPILIH */

          if (shouldOpen) {

            subgroupContent.hidden = false;

            subgroupToggle.setAttribute(
              "aria-expanded",
              "true"
            );

            subgroupArrow.textContent = "⌃";

          }

        });


        subgroupList.appendChild(subgroupElement);

      }
    );


    /* =================================================
       11. TOMBOL TUTUP PANEL
       TANPA SCROLL OTOMATIS
    ================================================= */

    panel.querySelector(
      ".vocab-close-button"
    ).addEventListener("click", () => {

      closeActivePanel();

    });


    return panel;

  }


  /* =====================================================
     12. AUDIO PELAFALAN BAHASA JEPANG
  ===================================================== */

  function speakJapanese(text) {

    if (!("speechSynthesis" in window)) {

      alert(
        "Maaf, browser ini belum mendukung audio pelafalan."
      );

      return;

    }


    /* HENTIKAN AUDIO SEBELUMNYA */

    window.speechSynthesis.cancel();


    /* BUAT PELAFALAN BAHASA JEPANG */

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "ja-JP";

    utterance.rate = 0.85;

    utterance.pitch = 1;


    /* PUTAR AUDIO */

    window.speechSynthesis.speak(utterance);

  }


  /* =====================================================
     13. MULAI MEMUAT DATA
  ===================================================== */

  loadVocabularyData();

});
