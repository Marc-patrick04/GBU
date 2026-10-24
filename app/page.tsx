"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import "./bible.css";
import "./mobile-comparison.css";
import "./bible-navigation.css";

type Screen = "home" | "bible" | "groups" | "account";

type Translation = "NIV" | "KJV" | "ESV" | "BY" | "BIR";
type Verse = { number: string; text: string };
type BibleBook = { id: number; name: string; chapters: Verse[][] };

const translations: Record<Translation, string> = {
  NIV: "New International Version", KJV: "King James Version", ESV: "English Standard Version", BY: "Biblia Yera", BIR: "Biblia in Kinyarwanda",
};

const kinyarwandaBookNames = [
  "Itangiriro", "Kuva", "Abalewi", "Kubara", "Gutegeka kwa kabiri", "Yosuwa", "Abacamanza", "Rusi", "1 Samweli", "2 Samweli", "1 Abami", "2 Abami", "1 Ngoma", "2 Ngoma", "Ezira", "Nehemiya", "Esiteri", "Yobu", "Zaburi", "Imigani", "Umubwiriza", "Indirimbo ya Salomo", "Yesaya", "Yeremiya", "Amaganya", "Ezekiyeli", "Daniyeli", "Hoseya", "Yoweli", "Amosi", "Obadiya", "Yona", "Mika", "Nahumu", "Habakuki", "Zefaniya", "Hagayi", "Zekariya", "Malaki", "Matayo", "Mariko", "Luka", "Yohana", "Ibyakozwe n'Intumwa", "Abaroma", "1 Abakorinto", "2 Abakorinto", "Abagalatiya", "Abefeso", "Abafilipi", "Abakolosayi", "1 Abatesalonike", "2 Abatesalonike", "1 Timoteyo", "2 Timoteyo", "Tito", "Filemoni", "Abaheburayo", "Yakobo", "1 Petero", "2 Petero", "1 Yohana", "2 Yohana", "3 Yohana", "Yuda", "Ibyahishuwe",
];

function parseBible(xml: string): BibleBook[] {
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
    const name = isRwandan ? kinyarwandaBookNames[id - 1] : book.getAttribute(isZefania ? "bname" : "n");
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
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
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
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const versionsToLoad = [version, comparison].filter(Boolean) as Translation[];
    let active = true;
    Promise.all(versionsToLoad.map(async (translation) => {
      if (library[translation]) return [translation, library[translation]] as const;
      const response = await fetch(`/bibles/${translation}.xml`);
      if (!response.ok) throw new Error(`Could not load ${translation}`);
      return [translation, parseBible(await response.text())] as const;
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

  useEffect(() => {
    if (book && book.name !== bookName) setBookName(book.name);
    if (book && chapterNumber > book.chapters.length) setChapterNumber(1);
  }, [book, bookName, chapterNumber]);

  function selectBook(nextBook: string) { setBookName(nextBook); setChapterNumber(1); setSelectedVerse(""); setSearch(""); }
  function selectChapter(nextChapter: number) { setChapterNumber(nextChapter); setSelectedVerse(""); setSearch(""); setChapterPickerOpen(false); }

  return <>
    <h1 className="bible-title">Bible</h1>
    <div className="bible-controls">
      <label><span>Version</span><select value={version} onChange={(event) => { setVersion(event.target.value as Translation); setComparison(""); setSelectedVerse(""); }}>{Object.entries(translations).map(([key, name]) => <option value={key} key={key}>{key} · {name}</option>)}</select></label>
      <label><span>Book</span><select value={book?.name ?? bookName} onChange={(event) => selectBook(event.target.value)}>{books.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
      <label><span>Chapter</span><button type="button" className="chapter-select" onClick={() => setChapterPickerOpen((open) => !open)}>{chapterNumber}<Icon name="chevron" /></button></label>
      <label><span>Verse</span><select value={selectedVerse} onChange={(event) => setSelectedVerse(event.target.value)}><option value="">All verses</option>{chapter.map((verse) => <option key={verse.number} value={verse.number}>{verse.number}</option>)}</select></label>
    </div>
    {chapterPickerOpen && <div className="chapter-picker" aria-label="Choose a chapter">{Array.from({ length: book?.chapters.length ?? 0 }, (_, index) => index + 1).map((number) => <button key={number} className={number === chapterNumber ? "active" : ""} onClick={() => selectChapter(number)}>{number}</button>)}</div>}
    <div className="compare-bar"><label><span>Compare with</span><select value={comparison} onChange={(event) => setComparison(event.target.value as Translation | "")}><option value="">No comparison</option>{Object.entries(translations).filter(([key, name]) => key !== version).map(([key, name]) => <option value={key} key={key}>{key} · {name}</option>)}</select></label></div>
    <label className="search"><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this chapter" /></label>
    {loading ? <p className="loading">Preparing your offline Bible library…</p> : <>
      {comparison && <MobileComparison version={version} comparison={comparison} book={book} comparisonBook={comparisonBook} chapterNumber={chapterNumber} verses={visible} comparisonVerses={comparisonChapter} search={search} selectedVerse={selectedVerse} />}
      <div className={comparison ? "scripture-layout comparison desktop-comparison" : "scripture-layout"}>
        <Scripture version={version} book={book} chapterNumber={chapterNumber} verses={visible} search={search} selectedVerse={selectedVerse} />
        {comparison && <Scripture version={comparison} book={comparisonBook} chapterNumber={chapterNumber} verses={comparisonChapter.filter((verse) => verse.text.toLowerCase().includes(search.toLowerCase()))} search={search} selectedVerse={selectedVerse} />}
      </div>
    </>}
  </>;
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
