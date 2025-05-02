import { BookmarkCategory } from "./local-storage-service";
import { v4 as uuidv4 } from 'uuid';

// Default categories to use when no categories exist
export const DEFAULT_CATEGORIES = [
  {
    id: "security-tools",
    name: "Security Tools",
    icon: "shield-alert",
    bookmarks: [
      { id: "st-1", title: "Kali Linux", url: "https://www.kali.org/", color: "bg-blue-500", category_id: "security-tools" },
      { id: "st-2", title: "Metasploit", url: "https://www.metasploit.com/", color: "bg-red-500", category_id: "security-tools" },
      { id: "st-3", title: "Wireshark", url: "https://www.wireshark.org/", color: "bg-green-500", category_id: "security-tools" },
      { id: "st-4", title: "Burp Suite", url: "https://portswigger.net/burp", color: "bg-orange-500", category_id: "security-tools" },
      { id: "st-5", title: "OWASP", url: "https://owasp.org/", color: "bg-purple-500", category_id: "security-tools" },
      { id: "st-6", title: "Nmap", url: "https://nmap.org/", color: "bg-cyan-500", category_id: "security-tools" }
    ]
  },
  {
    id: "learning",
    name: "Learning Resources",
    icon: "book-open",
    bookmarks: [
      { id: "lr-1", title: "TryHackMe", url: "https://tryhackme.com/", color: "bg-red-500", category_id: "learning" },
      { id: "lr-2", title: "HackTheBox", url: "https://www.hackthebox.com/", color: "bg-green-500", category_id: "learning" },
      { id: "lr-3", title: "Cybrary", url: "https://www.cybrary.it/", color: "bg-blue-500", category_id: "learning" },
      { id: "lr-4", title: "PortSwigger Academy", url: "https://portswigger.net/web-security", color: "bg-orange-500", category_id: "learning" },
      { id: "lr-5", title: "Hack The Box Academy", url: "https://academy.hackthebox.com/", color: "bg-green-500", category_id: "learning" }
    ]
  },
  {
    id: "news",
    name: "Security News",
    icon: "newspaper",
    bookmarks: [
      { id: "n-1", title: "Krebs on Security", url: "https://krebsonsecurity.com/", color: "bg-red-500", category_id: "news" },
      { id: "n-2", title: "The Hacker News", url: "https://thehackernews.com/", color: "bg-blue-500", category_id: "news" },
      { id: "n-3", title: "Threatpost", url: "https://threatpost.com/", color: "bg-purple-500", category_id: "news" },
      { id: "n-4", title: "Bleeping Computer", url: "https://www.bleepingcomputer.com/", color: "bg-cyan-500", category_id: "news" }
    ]
  },
  {
    id: "coding",
    name: "Coding Resources",
    icon: "code",
    bookmarks: [
      { id: "c-1", title: "GitHub", url: "https://github.com/", color: "bg-slate-500", category_id: "coding" },
      { id: "c-2", title: "Stack Overflow", url: "https://stackoverflow.com/", color: "bg-orange-500", category_id: "coding" },
      { id: "c-3", title: "MDN Web Docs", url: "https://developer.mozilla.org/", color: "bg-blue-500", category_id: "coding" },
      { id: "c-4", title: "W3Schools", url: "https://www.w3schools.com/", color: "bg-green-500", category_id: "coding" }
    ]
  },
  {
    id: "tools",
    name: "Useful Tools",
    icon: "wrench",
    bookmarks: [
      { id: "t-1", title: "CyberChef", url: "https://gchq.github.io/CyberChef/", color: "bg-yellow-500", category_id: "tools" },
      { id: "t-2", title: "VirusTotal", url: "https://www.virustotal.com/", color: "bg-blue-500", category_id: "tools" },
      { id: "t-3", title: "Shodan", url: "https://www.shodan.io/", color: "bg-red-500", category_id: "tools" },
      { id: "t-4", title: "GTFOBins", url: "https://gtfobins.github.io/", color: "bg-purple-500", category_id: "tools" }
    ]
  },
  {
    id: "work",
    name: "Work",
    icon: "briefcase",
    bookmarks: [
      { id: "w-1", title: "Gmail", url: "https://mail.google.com/", color: "bg-red-500", category_id: "work" },
      { id: "w-2", title: "Google Drive", url: "https://drive.google.com/", color: "bg-yellow-500", category_id: "work" },
      { id: "w-3", title: "Slack", url: "https://slack.com/", color: "bg-purple-500", category_id: "work" },
      { id: "w-4", title: "Notion", url: "https://www.notion.so/", color: "bg-slate-500", category_id: "work" }
    ]
  },
  {
    id: "ctf",
    name: "CTF Platforms",
    icon: "gamepad",
    bookmarks: [
      { id: "ctf-1", title: "CTFtime", url: "https://ctftime.org/", color: "bg-green-500", category_id: "ctf" },
      { id: "ctf-2", title: "PicoCTF", url: "https://picoctf.org/", color: "bg-blue-500", category_id: "ctf" },
      { id: "ctf-3", title: "VulnHub", url: "https://www.vulnhub.com/", color: "bg-red-500", category_id: "ctf" },
      { id: "ctf-4", title: "Root Me", url: "https://www.root-me.org/", color: "bg-purple-500", category_id: "ctf" }
    ]
  },
];

// Get a copy of the default bookmarks - no need to change category IDs since they're already correct
export const getDefaultBookmarks = () => {
  // Make a deep copy to avoid modifying the original
  return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
};

// Color options for bookmarks
export const COLORS = ["blue", "red", "green", "purple", "cyan", "orange", "yellow"]; 