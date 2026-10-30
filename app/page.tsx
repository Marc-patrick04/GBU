"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import "./bible.css";
import "./mobile-comparison.css";
import "./bible-navigation.css";
import "./reader-mode.css";
import "./install.css";

type Screen = "home" | "bible" | "groups" | "account";

type Translation = "NIV" | "KJV" | "ESV" | "BY" | "BIR";
type Verse = { number: string; text: string };
type BibleBook = { id: number; name: string; chapters: Verse[][] };
type BiblePosition = { version: Translation; bookName: string; chapterNumber: number; selectedVerse: string };
type BibleSearchResult = { bookName: string; chapterNumber: number; verse: Verse };
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const biblePositionStorageKey = "gbur-bible-position";

const translations: Record<Translation, string> = {
  NIV: "New International Version", KJV: "King James Version", ESV: "English Standard Version", BY: "Bibiliya Yera", BIR: "Bibiliya Ijambo ry'Imana",
};

const byBookNames = [
  "Itangiriro", "Kuva", "Abalewi", "Kubara", "Gutegeka kwa kabiri", "Yosuwa", "Abacamanza", "Rusi", "1 Samweli", "2 Samweli", "1 Abami", "2 Abami", "1 Ngoma", "2 Ngoma", "Ezira", "Nehemiya", "Esiteri", "Yobu", "Zaburi", "Imigani", "Umubwiriza", "Indirimbo ya Salomo", "Yesaya", "Yeremiya", "Amaganya", "Ezekiyeli", "Daniyeli", "Hoseya", "Yoweli", "Amosi", "Obadiya", "Yona", "Mika", "Nahumu", "Habakuki", "Zefaniya", "Hagayi", "Zekariya", "Malaki", "Matayo", "Mariko", "Luka", "Yohana", "Ibyakozwe n'Intumwa", "Abaroma", "1 Abakorinto", "2 Abakorinto", "Abagalatiya", "Abefeso", "Abafilipi", "Abakolosayi", "1 Abatesalonike", "2 Abatesalonike", "1 Timoteyo", "2 Timoteyo", "Tito", "Filemoni", "Abaheburayo", "Yakobo", "1 Petero", "2 Petero", "1 Yohana", "2 Yohana", "3 Yohana", "Yuda", "Ibyahishuwe",
];

const birBookNames = [
  "Intangiriro", "Iyimukamisiri", "Abalewi", "Ibarura", "Ivugurura ry'Amategeko", "Yosuwa", "Abacamanza", "Rusi", "1 Samweli", "2 Samweli", "1 Abami", "2 Abami", "1 Ngoma", "2 Ngoma", "Ezira", "Nehemiya", "Esiteri", "Yobu", "Zaburi", "Imigani", "Umubwiriza", "Indirimbo ya Salomo", "Yesaya", "Yeremiya", "Amaganya", "Ezekiyeli", "Daniyeli", "Hoseya", "Yoweli", "Amosi", "Obadiya", "Yona", "Mika", "Nahumu", "Habakuki", "Zefaniya", "Hagayi", "Zekariya", "Malaki", "Matayo", "Mariko", "Luka", "Yohana", "Ibyakozwe n'Intumwa", "Abaroma", "1 Abakorinto", "2 Abakorinto", "Abagalatiya", "Abefeso", "Abafilipi", "Abakolosayi", "1 Abatesalonike", "2 Abatesalonike", "1 Timoteyo", "2 Timoteyo", "Tito", "Filemoni", "Abaheburayo", "Yakobo", "1 Petero", "2 Petero", "1 Yohana", "2 Yohana", "3 Yohana", "Yuda", "Ibyahishuwe",
];

function parseBible(xml: string, translation: Translation): BibleBook[] {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  const isZefania = document.getElementsByTagName("BIBLEBOOK").length > 0;
  const isRwandan = document.getElementsByTagName("book").length > 0;
  const bookNodes = Array.from(document.getElementsByTagName(isZefania ? "BIBLEBOOK" : isRwandan ? "book" : "b"));
  return bookNodes.map((book, index) => {
    const chapters = Array.from(book.getElementsByTagName(isZefania ? "CHAPTER" : isRwandan ? "chapter" : "c")).map((chapter) =>
      Array.from(chapter.getElementsByTagName(isZefania ? "VERS" : isRwandan ? "verse" : "v")).map((verse) => ({
        number: verse.getAttribute(isZefania ? "vnumber" : isRwandan ? "number" : "n") ?? "",
        text: verse.textContent?.replace(/\s+/g, " ").trim() ?? "",
      })),
    );
    const id = Number(book.getAttribute(isZefania ? "bnumber" : "number")) || index + 1;
    const name = isRwandan ? (translation === "BIR" ? birBookNames : byBookNames)[id - 1] : book.getAttribute(isZefania ? "bname" : "n");
    return { id, name: name ?? "Untitled", chapters };
  });
}

function Icon({ name }: { name: "home" | "book" | "users" | "user" | "arrow" | "search" | "download" | "chevron" }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></>,
    book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M4 4.5v17" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 4.5a3 3 0 0 1 0 5.8M21 21v-2a6 6 0 0 0-3.5-5.5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 22a8 8 0 0 1 16 0" /></>,
    arrow: <path d="m5 12 14 0m-6-6 6 6-6 6" />,
    search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 21h14" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let refreshing = false;
    navigator.serviceWorker.register("/sw.js").then((registration) => registration.update()).catch(() => undefined);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }, []);
  return null;
}

function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const appInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    const beforeInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); };
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", appInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", beforeInstall); window.removeEventListener("appinstalled", appInstalled); };
  }, []);

  async function install() {
    if (!installPrompt) { setHelpOpen(true); return; }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  if (installed) return null;
  return <>{helpOpen && <div className="install-help" role="dialog" aria-modal="true"><button className="install-help-backdrop" aria-label="Close install instructions" onClick={() => setHelpOpen(false)} /><section><button className="install-help-close" onClick={() => setHelpOpen(false)} aria-label="Close">×</button><h2>Install GBUR</h2><p>On Android, open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</p><p>On iPhone, tap <b>Share</b>, then choose <b>Add to Home Screen</b>.</p></section></div>}<button className="install-app-button" onClick={install}><Icon name="download" /><span>Install app</span></button></>;
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const nav = [
    ["home", "Home", "home"], ["book", "Bible", "bible"], ["users", "Groups", "groups"], ["user", "Account", "account"],
  ] as const;

  return (
    <main className="app-shell">
      <ServiceWorker />
      <InstallAppButton />
      <header className="topbar">
        <div className="brand"><Image src="/logo.png" alt="GBUR logo" width={44} height={44} priority /><span><strong>GBUR</strong><small>RP Musanze College</small></span></div>
        <button className="avatar" aria-label="Open account" onClick={() => setScreen("account")}>JM</button>
      </header>

      <section className="content">
        {screen === "home" && <Home setScreen={setScreen} saved={saved} setSaved={setSaved} />}
        {screen === "bible" && <Bible search={search} setSearch={setSearch} />}
        {screen === "groups" && <Groups />}
        {screen === "account" && <Account />}
      </section>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {nav.map(([icon, label, target]) => <button key={target} className={screen === target ? "active" : ""} onClick={() => setScreen(target)}><Icon name={icon} /><span>{label}</span></button>)}
      </nav>
    </main>
  );
}

function Home({ setScreen, saved, setSaved }: { setScreen: (screen: Screen) => void; saved: boolean; setSaved: (value: boolean) => void }) {
  return <div className="home-screen">
    <div className="welcome"><p>THURSDAY, OCTOBER 23</p><h1>Good morning, Joseph.</h1><span>Walk in faith today.</span></div>
    <article className="verse-card"><div className="card-label">VERSE OF THE DAY</div><blockquote>“For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future.”</blockquote><div className="verse-ref">Jeremiah 29:11 <button onClick={() => setSaved(!saved)} className={saved ? "saved" : ""}>{saved ? "Saved" : "Save verse"}</button></div></article>
    <div className="section-heading"><h2>For you</h2><button onClick={() => setScreen("bible")}>View Bible <Icon name="arrow" /></button></div>
    <article className="reading-card"><div className="reading-art">✦</div><div><p className="eyebrow">DAILY READING</p><h3>Walking in God’s purpose</h3><span>Psalm 23 · 5 min read</span></div><Icon name="chevron" /></article>
    <div className="section-heading"><h2>Latest</h2><button>See all <Icon name="arrow" /></button></div>
    <article className="announcement"><div className="announcement-icon">📣</div><div><p className="eyebrow">COMMUNITY</p><h3>Friday fellowship is tomorrow</h3><span>6:00 PM · Main Hall</span></div></article>
  </div>;
}

function Bible({ search, setSearch }: { search: string; setSearch: (value: string) => void }) {
  const [version, setVersion] = useState<Translation>("NIV");
  const [comparison, setComparison] = useState<Translation | "">("");
  const [library, setLibrary] = useState<Partial<Record<Translation, BibleBook[]>>>({});
  const [bookName, setBookName] = useState("Genesis");
  const [chapterNumber, setChapterNumber] = useState(1);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false);
  const [versePickerOpen, setVersePickerOpen] = useState(false);
  const [readerControlsOpen, setReaderControlsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState("");
  const [loading, setLoading] = useState(true);
  const [positionRestored, setPositionRestored] = useState(false);

  useEffect(() => {
    try {
      const savedPosition = JSON.parse(localStorage.getItem(biblePositionStorageKey) ?? "null") as Partial<BiblePosition> | null;
      const savedVersion = savedPosition?.version;
      const savedChapter = savedPosition?.chapterNumber;
      if (savedPosition && typeof savedVersion === "string" && savedVersion in translations) {
        setVersion(savedVersion as Translation);
        setBookName(typeof savedPosition.bookName === "string" ? savedPosition.bookName : "Genesis");
        setChapterNumber(typeof savedChapter === "number" && Number.isInteger(savedChapter) && savedChapter > 0 ? savedChapter : 1);
        setSelectedVerse(typeof savedPosition.selectedVerse === "string" ? savedPosition.selectedVerse : "");
      }
    } catch {
      localStorage.removeItem(biblePositionStorageKey);
    } finally {
      setPositionRestored(true);
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("gbur-reader-theme");
    setDarkMode(savedTheme === "dark");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("reader-dark-mode", darkMode);
    localStorage.setItem("gbur-reader-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!positionRestored) return;
    const position: BiblePosition = { version, bookName, chapterNumber, selectedVerse };
    localStorage.setItem(biblePositionStorageKey, JSON.stringify(position));
  }, [version, bookName, chapterNumber, selectedVerse, positionRestored]);

  useEffect(() => {
    const versionsToLoad = [version, comparison].filter(Boolean) as Translation[];
    let active = true;
    Promise.all(versionsToLoad.map(async (translation) => {
      if (library[translation]) return [translation, library[translation]] as const;
      const response = await fetch(`/bibles/${translation}.xml`);
      if (!response.ok) throw new Error(`Could not load ${translation}`);
      return [translation, parseBible(await response.text(), translation)] as const;
    })).then((items) => {
      if (!active) return;
      setLibrary((current) => ({ ...current, ...Object.fromEntries(items) }));
      setLoading(false);
    }).catch(() => active && setLoading(false));
    return () => { active = false; };
  }, [version, comparison]);

  const books = library[version] ?? [];
  const book = books.find((item) => item.name === bookName) ?? books[0];
  const chapter = book?.chapters[chapterNumber - 1] ?? [];
  const comparisonBook = comparison ? library[comparison]?.find((item) => item.id === book?.id) : undefined;
  const comparisonChapter = comparisonBook?.chapters[chapterNumber - 1] ?? [];
  const visible = useMemo(() => chapter.filter((verse) => verse.text.toLowerCase().includes(search.toLowerCase())), [chapter, search]);
  const searchResults = useMemo<BibleSearchResult[]>(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return [];
    return books.flatMap((item) => item.chapters.flatMap((verses, chapterIndex) => verses.filter((verse) => verse.text.toLocaleLowerCase().includes(query)).map((verse) => ({ bookName: item.name, chapterNumber: chapterIndex + 1, verse })))).slice(0, 100);
  }, [books, search]);

  useEffect(() => {
    if (book && book.name !== bookName) setBookName(book.name);
    if (book && chapterNumber > book.chapters.length) setChapterNumber(1);
    if (selectedVerse && !chapter.some((verse) => verse.number === selectedVerse)) setSelectedVerse("");
  }, [book, bookName, chapterNumber, chapter, selectedVerse]);

  useEffect(() => {
    if (!selectedVerse || loading) return;
    const scrollTimer = window.setTimeout(() => {
      const selectedElement = Array.from(document.querySelectorAll<HTMLElement>(".verse.selected, .verse-pair.selected")).find((element) => element.getClientRects().length > 0);
      selectedElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
    return () => window.clearTimeout(scrollTimer);
  }, [selectedVerse, loading, version, bookName, chapterNumber, comparison]);

  useEffect(() => {
    if (!bookPickerOpen) return;
    const scrollTimer = window.setTimeout(() => {
      const selectedBook = Array.from(document.querySelectorAll<HTMLElement>(".book-picker button.active")).find((element) => element.getClientRects().length > 0);
      selectedBook?.scrollIntoView({ block: "center" });
    }, 0);
    return () => window.clearTimeout(scrollTimer);
  }, [bookPickerOpen, bookName]);

  function selectBook(nextBook: string) { setBookName(nextBook); setChapterNumber(1); setSelectedVerse(""); setSearch(""); setBookPickerOpen(false); }
  function selectChapter(nextChapter: number) { setChapterNumber(nextChapter); setSelectedVerse(""); setSearch(""); setChapterPickerOpen(false); }
  function selectVerse(nextVerse: string) { setSelectedVerse(nextVerse); setVersePickerOpen(false); setReaderControlsOpen(false); }
  function openSearchResult(result: BibleSearchResult) { setBookName(result.bookName); setChapterNumber(result.chapterNumber); setSelectedVerse(result.verse.number); setSearch(""); setSearchOpen(false); }

  return <>
    <h1 className="bible-title">Bible</h1>
    <div className="desktop-reader-controls">
    <div className="translation-controls">
      <label><span>Version</span><select value={version} onChange={(event) => { setVersion(event.target.value as Translation); setComparison(""); setSelectedVerse(""); }}>{Object.entries(translations).map(([key, name]) => <option value={key} key={key}>{key} · {name}</option>)}</select></label>
      <div className="compare-bar"><label><span>Compare with</span><select value={comparison} onChange={(event) => setComparison(event.target.value as Translation | "")}><option value="">No comparison</option>{Object.entries(translations).filter(([key, name]) => key !== version).map(([key, name]) => <option value={key} key={key}>{key} · {name}</option>)}</select></label></div>
    </div>
    <div className="bible-controls">
      <label><span>Book</span><button type="button" className="chapter-select" onClick={() => { setBookPickerOpen((open) => !open); setChapterPickerOpen(false); setVersePickerOpen(false); }}><b>{book?.name ?? bookName}</b><Icon name="chevron" /></button></label>
      <label><span>Chapter</span><button type="button" className="chapter-select" onClick={() => { setChapterPickerOpen((open) => !open); setBookPickerOpen(false); setVersePickerOpen(false); }}>{chapterNumber}<Icon name="chevron" /></button></label>
      <label><span>Verse</span><button type="button" className={selectedVerse ? "chapter-select verse-select active" : "chapter-select verse-select"} onClick={() => { setVersePickerOpen((open) => !open); setBookPickerOpen(false); setChapterPickerOpen(false); }}>{selectedVerse || "All"}<Icon name="chevron" /></button></label>
    </div>
    {bookPickerOpen && <div className="chapter-picker book-picker" aria-label="Choose a book">{books.map((item) => <button key={item.id} className={item.name === book?.name ? "active" : ""} onClick={() => selectBook(item.name)}>{item.name}</button>)}</div>}
    {chapterPickerOpen && <div className="chapter-picker" aria-label="Choose a chapter">{Array.from({ length: book?.chapters.length ?? 0 }, (_, index) => index + 1).map((number) => <button key={number} className={number === chapterNumber ? "active" : ""} onClick={() => selectChapter(number)}>{number}</button>)}</div>}
    {versePickerOpen && <div className="chapter-picker verse-picker" aria-label="Choose a verse"><button className={!selectedVerse ? "active" : ""} onClick={() => selectVerse("")}>All</button>{chapter.map((verse) => <button key={verse.number} className={verse.number === selectedVerse ? "active" : ""} onClick={() => selectVerse(verse.number)}>{verse.number}</button>)}</div>}
    </div>
    {readerControlsOpen && <><MobileReaderSheet version={version} comparison={comparison} book={book} bookName={bookName} chapterNumber={chapterNumber} selectedVerse={selectedVerse} books={books} chapter={chapter} bookPickerOpen={bookPickerOpen} chapterPickerOpen={chapterPickerOpen} versePickerOpen={versePickerOpen} darkMode={darkMode} setDarkMode={setDarkMode} setVersion={setVersion} setComparison={setComparison} setSelectedVerse={setSelectedVerse} setBookPickerOpen={setBookPickerOpen} setChapterPickerOpen={setChapterPickerOpen} setVersePickerOpen={setVersePickerOpen} onSelectBook={selectBook} onSelectChapter={selectChapter} onSelectVerse={selectVerse} onClose={() => setReaderControlsOpen(false)} /><MobileSettingsOverlay version={version} comparison={comparison} book={book} chapterNumber={chapterNumber} selectedVerse={selectedVerse} books={books} chapter={chapter} setVersion={setVersion} setComparison={setComparison} onSelectBook={selectBook} onSelectChapter={selectChapter} onSelectVerse={selectVerse} onClose={() => setReaderControlsOpen(false)} /></>}
    <div className="sticky-chapter-nav"><button aria-label="Previous chapter" onClick={() => selectChapter(chapterNumber - 1)} disabled={chapterNumber <= 1}>‹</button><span>{book?.name ?? "Bible"} {chapterNumber}</span><button aria-label="Next chapter" onClick={() => selectChapter(chapterNumber + 1)} disabled={!book || chapterNumber >= book.chapters.length}>›</button></div>
    <div className="mobile-sticky-reader-nav"><button aria-label="Previous chapter" onClick={() => selectChapter(chapterNumber - 1)} disabled={chapterNumber <= 1}>‹</button><button className="sticky-reader-context" onClick={() => setReaderControlsOpen(true)} title={translations[version]}><span>{translations[version]}</span><b>{book?.name ?? "Bible"} {chapterNumber}</b><Icon name="chevron" /></button><button className="theme-bar-toggle" aria-label="Toggle dark mode" onClick={() => setDarkMode((enabled) => !enabled)}>{darkMode ? "☀" : "◐"}</button><button className="sticky-search-toggle" aria-label="Search the Bible" onClick={() => setSearchOpen((open) => !open)}><Icon name="search" /></button><button aria-label="Next chapter" onClick={() => selectChapter(chapterNumber + 1)} disabled={!book || chapterNumber >= book.chapters.length}>›</button></div>
    <label className={searchOpen ? "search open" : "search"}><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the Bible" />{searchOpen && <button className="search-clear" type="button" aria-label="Clear and close search" onClick={() => { setSearch(""); setSearchOpen(false); }}>×</button>}</label>
    {loading ? <p className="loading">Preparing your offline Bible library…</p> : search.trim() ? <BibleSearchResults results={searchResults} onSelect={openSearchResult} /> : <>
      {comparison && <MobileComparison version={version} comparison={comparison} book={book} comparisonBook={comparisonBook} chapterNumber={chapterNumber} verses={visible} comparisonVerses={comparisonChapter} search={search} selectedVerse={selectedVerse} />}
      <div className={comparison ? "scripture-layout comparison desktop-comparison" : "scripture-layout"}>
        <Scripture version={version} book={book} chapterNumber={chapterNumber} verses={visible} search={search} selectedVerse={selectedVerse} />
        {comparison && <Scripture version={comparison} book={comparisonBook} chapterNumber={chapterNumber} verses={comparisonChapter.filter((verse) => verse.text.toLowerCase().includes(search.toLowerCase()))} search={search} selectedVerse={selectedVerse} />}
      </div>
    </>}
  </>;
}

function BibleSearchResults({ results, onSelect }: { results: BibleSearchResult[]; onSelect: (result: BibleSearchResult) => void }) {
  return <section className="search-results"><p className="eyebrow">{results.length === 100 ? "FIRST 100 RESULTS" : `${results.length} RESULTS`}</p>{results.map((result) => <button key={`${result.bookName}-${result.chapterNumber}-${result.verse.number}`} onClick={() => onSelect(result)}><span>{result.bookName} {result.chapterNumber}:{result.verse.number}</span><p>{result.verse.text}</p></button>)}{!results.length && <p className="empty">No matching verses were found.</p>}</section>;
}

function MobileReaderSheet({ version, comparison, book, bookName, chapterNumber, selectedVerse, books, chapter, bookPickerOpen, chapterPickerOpen, versePickerOpen, darkMode, setDarkMode, setVersion, setComparison, setSelectedVerse, setBookPickerOpen, setChapterPickerOpen, setVersePickerOpen, onSelectBook, onSelectChapter, onSelectVerse, onClose }: { version: Translation; comparison: Translation | ""; book?: BibleBook; bookName: string; chapterNumber: number; selectedVerse: string; books: BibleBook[]; chapter: Verse[]; bookPickerOpen: boolean; chapterPickerOpen: boolean; versePickerOpen: boolean; darkMode: boolean; setDarkMode: Dispatch<SetStateAction<boolean>>; setVersion: Dispatch<SetStateAction<Translation>>; setComparison: Dispatch<SetStateAction<Translation | "">>; setSelectedVerse: Dispatch<SetStateAction<string>>; setBookPickerOpen: Dispatch<SetStateAction<boolean>>; setChapterPickerOpen: Dispatch<SetStateAction<boolean>>; setVersePickerOpen: Dispatch<SetStateAction<boolean>>; onSelectBook: (book: string) => void; onSelectChapter: (chapter: number) => void; onSelectVerse: (verse: string) => void; onClose: () => void }) {
  return <><button className="reader-sheet-backdrop" aria-label="Close reading settings" onClick={onClose} /><section className="reader-sheet"><header><h2>Reading settings</h2><button aria-label="Close" onClick={onClose}>×</button></header><div className="translation-controls"><label><span>Version</span><select value={version} onChange={(event) => { setVersion(event.target.value as Translation); setComparison(""); setSelectedVerse(""); }}>{Object.entries(translations).map(([key, name]) => <option value={key} key={key}>{key} · {name}</option>)}</select></label><div className="compare-bar"><label><span>Compare with</span><select value={comparison} onChange={(event) => setComparison(event.target.value as Translation | "")}><option value="">No comparison</option>{Object.entries(translations).filter(([key]) => key !== version).map(([key, name]) => <option value={key} key={key}>{key} · {name}</option>)}</select></label></div></div><div className="bible-controls"><label><span>Book</span><button type="button" className="chapter-select" onClick={() => { setBookPickerOpen((open) => !open); setChapterPickerOpen(false); setVersePickerOpen(false); }}><b>{book?.name ?? bookName}</b><Icon name="chevron" /></button></label><label><span>Chapter</span><button type="button" className="chapter-select" onClick={() => { setChapterPickerOpen((open) => !open); setBookPickerOpen(false); setVersePickerOpen(false); }}>{chapterNumber}<Icon name="chevron" /></button></label><label><span>Verse</span><button type="button" className={selectedVerse ? "chapter-select verse-select active" : "chapter-select verse-select"} onClick={() => { setVersePickerOpen((open) => !open); setBookPickerOpen(false); setChapterPickerOpen(false); }}>{selectedVerse || "All"}<Icon name="chevron" /></button></label></div>{bookPickerOpen && <div className="chapter-picker book-picker">{books.map((item) => <button key={item.id} className={item.name === book?.name ? "active" : ""} onClick={() => onSelectBook(item.name)}>{item.name}</button>)}</div>}{chapterPickerOpen && <div className="chapter-picker">{Array.from({ length: book?.chapters.length ?? 0 }, (_, index) => index + 1).map((number) => <button key={number} className={number === chapterNumber ? "active" : ""} onClick={() => onSelectChapter(number)}>{number}</button>)}</div>}{versePickerOpen && <div className="chapter-picker verse-picker"><button className={!selectedVerse ? "active" : ""} onClick={() => onSelectVerse("")}>All</button>{chapter.map((verse) => <button key={verse.number} className={verse.number === selectedVerse ? "active" : ""} onClick={() => onSelectVerse(verse.number)}>{verse.number}</button>)}</div>}</section></>;
}

function MobileSettingsOverlay({ version, comparison, book, chapterNumber, selectedVerse, books, chapter, setVersion, setComparison, onSelectBook, onSelectChapter, onSelectVerse, onClose }: { version: Translation; comparison: Translation | ""; book?: BibleBook; chapterNumber: number; selectedVerse: string; books: BibleBook[]; chapter: Verse[]; setVersion: Dispatch<SetStateAction<Translation>>; setComparison: Dispatch<SetStateAction<Translation | "">>; onSelectBook: (book: string) => void; onSelectChapter: (chapter: number) => void; onSelectVerse: (verse: string) => void; onClose: () => void }) {
  const [picker, setPicker] = useState<"version" | "comparison" | "book" | "chapter" | "verse" | "">("");
  const toggle = (next: typeof picker) => setPicker((current) => current === next ? "" : next);
  const chooseVersion = (next: Translation) => { setVersion(next); setComparison(""); onSelectVerse(""); setPicker(""); };

  useEffect(() => {
    if (picker !== "book") return;
    const scrollTimer = window.setTimeout(() => document.querySelector<HTMLElement>(".book-options button.active")?.scrollIntoView({ block: "center" }), 0);
    return () => window.clearTimeout(scrollTimer);
  }, [picker, book?.id]);

  return <><button className="mobile-settings-backdrop" onClick={onClose} aria-label="Close reading settings" /><section className="mobile-settings-overlay"><header><h2>Reading settings</h2><button onClick={onClose} aria-label="Close">×</button></header><div className="mobile-setting-grid"><label><span>Version</span><button onClick={() => toggle("version")}>{translations[version]} <Icon name="chevron" /></button></label><label><span>Compare with</span><button onClick={() => toggle("comparison")}>{comparison ? translations[comparison] : "No comparison"} <Icon name="chevron" /></button></label><label className="book-setting"><span>Book</span><button onClick={() => toggle("book")}>{book?.name ?? "Bible"} <Icon name="chevron" /></button></label><label><span>Chapter</span><button className="chapter-choice" onClick={() => toggle("chapter")}>{chapterNumber} <Icon name="chevron" /></button></label><label><span>Verse</span><button className={selectedVerse ? "verse-choice active" : "verse-choice"} onClick={() => toggle("verse")}>{selectedVerse || "All"} <Icon name="chevron" /></button></label></div>{picker === "version" && <div className="mobile-option-list">{Object.entries(translations).map(([key, name]) => <button className={key === version ? "active" : ""} key={key} onClick={() => chooseVersion(key as Translation)}>{name}</button>)}</div>}{picker === "comparison" && <div className="mobile-option-list"><button className={!comparison ? "active" : ""} onClick={() => { setComparison(""); setPicker(""); }}>No comparison</button>{Object.entries(translations).filter(([key]) => key !== version).map(([key, name]) => <button className={key === comparison ? "active" : ""} key={key} onClick={() => { setComparison(key as Translation); setPicker(""); }}>{name}</button>)}</div>}{picker === "book" && <div className="mobile-option-list book-options">{books.map((item) => <button className={item.id === book?.id ? "active" : ""} key={item.id} onClick={() => { onSelectBook(item.name); setPicker(""); }}>{item.name}</button>)}</div>}{picker === "chapter" && <div className="mobile-number-grid">{Array.from({ length: book?.chapters.length ?? 0 }, (_, index) => index + 1).map((number) => <button className={number === chapterNumber ? "active" : ""} key={number} onClick={() => { onSelectChapter(number); setPicker(""); }}>{number}</button>)}</div>}{picker === "verse" && <div className="mobile-number-grid verse-options"><button className={!selectedVerse ? "active" : ""} onClick={() => { onSelectVerse(""); setPicker(""); }}>All</button>{chapter.map((verse) => <button className={verse.number === selectedVerse ? "active" : ""} key={verse.number} onClick={() => { onSelectVerse(verse.number); setPicker(""); }}>{verse.number}</button>)}</div>}</section></>;
}

function MobileComparison({ version, comparison, book, comparisonBook, chapterNumber, verses, comparisonVerses, search, selectedVerse }: { version: Translation; comparison: Translation; book?: BibleBook; comparisonBook?: BibleBook; chapterNumber: number; verses: Verse[]; comparisonVerses: Verse[]; search: string; selectedVerse: string }) {
  const comparisonByNumber = new Map(comparisonVerses.map((verse) => [verse.number, verse.text]));

  return <section className="mobile-comparison">
    <div className="comparison-title"><h2>{book?.name ?? comparisonBook?.name ?? "Bible"} {chapterNumber}</h2><span>{version} and {comparison}</span></div>
    {verses.map((verse) => <article className={selectedVerse === verse.number ? "verse-pair selected" : "verse-pair"} key={verse.number}>
      <div><p className="translation-label">{version} · Verse {verse.number}</p><p>{verse.text}</p></div>
      <div><p className="translation-label">{comparison} · Verse {verse.number}</p><p>{comparisonByNumber.get(verse.number) ?? "Verse unavailable in this translation."}</p></div>
    </article>)}
    {!verses.length && <p className="empty">{search ? "No matching verses in this chapter." : "This chapter is not available yet."}</p>}
  </section>;
}

function Scripture({ version, book, chapterNumber, verses, search, selectedVerse }: { version: Translation; book?: BibleBook; chapterNumber: number; verses: Verse[]; search: string; selectedVerse: string }) {
  return <article className="scripture"><div className="scripture-heading"><div><p className="eyebrow">{version} · {translations[version]}</p><h2>{book?.name ?? "Bible"} {chapterNumber}</h2></div></div>{verses.map((verse) => <p className={selectedVerse === verse.number ? "verse selected" : "verse"} key={verse.number}><sup>{verse.number}</sup>{verse.text}</p>)}{!verses.length && <p className="empty">{search ? "No matching verses in this chapter." : "This chapter is not available yet."}</p>}</article>;
}

function Groups() {
  return <><div className="screen-title"><p>MY COMMUNITY</p><h1>Small groups</h1></div><article className="group-hero"><p className="eyebrow">YOUR GROUP</p><h2>Grace & Growth</h2><span>Every Wednesday · 6:00 PM</span><div className="member-stack"><i>AN</i><i>EM</i><i>PM</i><b>+8 members</b></div></article><div className="section-heading"><h2>Next meeting</h2></div><article className="meeting"><div><strong>30</strong><span>OCT</span></div><section><h3>Living with purpose</h3><p>Study: Ephesians 2</p><small>6:00 PM · Room B12</small></section></article><button className="primary-button">Open group discussion <Icon name="arrow" /></button></>;
}

function Account() {
  return <><div className="profile"><div className="profile-avatar">JM</div><h1>Joseph Mugisha</h1><p>RP Musanze College</p></div><div className="account-list"><button><span>My notebook</span><Icon name="chevron" /></button><button><span>Saved verses</span><Icon name="chevron" /></button><button><span>Downloads & offline access</span><Icon name="chevron" /></button><button><span>Settings</span><Icon name="chevron" /></button></div><button className="sign-out">Sign out</button></>;
}
