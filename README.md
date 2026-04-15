# Salesforce Lightning Admin Enhancer

Productivity enhancements for Salesforce Lightning admins. Record lookup by ID, Setup shortcuts, Quick Find improvements, and more.

All features can be toggled on or off individually from the extension options page. When the extension updates, a badge appears on the toolbar icon and a What's New page opens automatically. A full Feature Tour is accessible from both the options page and the What's New page.

---

## Features

### Lightning

**Clickable Logo**
The Salesforce logo in the Lightning header does nothing by default. This feature makes it clickable — opening your Lightning home page in a new tab. A small change that saves time when you need to quickly jump back to home without losing what you're working on.

**Launch by ID**
Adds an input field next to the Lightning search bar. Paste any 15 or 18-digit Salesforce record ID, a relative path, or a full Salesforce URL and press Enter to navigate directly to that record. When a full URL is pasted, the hostname is stripped so the destination opens in your current org — useful when moving from production to sandbox for the same record.

**App Switcher Return**
When you switch apps using the Salesforce App Launcher, you're dropped on the new app's home page and lose your place. With this feature enabled, the extension remembers the record you were viewing and either automatically redirects you back to it, or shows a dismissible banner with a link. Choose your preferred behavior — auto-redirect or show prompt — from the options page.

**Login As Return**
When an admin logs out of a Login As session, Salesforce returns them to the Users list instead of the user they were just viewing. With this feature enabled, the extension automatically redirects back to that user's detail page in Setup after logging out.

**Record ID Display**
Shows the current record ID in the Lightning header on any record page — click to copy to clipboard. Updates automatically as you navigate between records.

### Setup

**Org ID Display**
Displays your organization's 18-digit Org ID in the Setup header — click to copy. On Setup pages that show a specific record (such as a user, permission set, or channel), the header switches to show the Record ID instead. Falls back to the Org ID on pages with no record context.

**Quick Find Layout**
In the Object Manager, the Quick Find filter is positioned on the right side of the header, pushing it away from the list you're filtering. This feature moves it to the left side of the header, keeping it visually aligned with the content below. Also applies to Object Manager detail pages such as Fields & Relationships and Page Layouts.

**Quick Focus**
Automatically moves focus to the Quick Find input when Setup pages load. This means you can start typing your search term the moment the page is ready — no need to click the field first. Small but makes navigating Setup noticeably faster.

**Setup Favorites**
Salesforce's native Favorites feature is not available in Setup by default. This feature adds the star icon and favorites dropdown to Setup pages, letting you bookmark your most-used Setup pages and access them from a dropdown — the same experience you get in Lightning. Your favorites are synced with your Salesforce account.

**My Setup Shortcuts**
Adds a configurable shortcuts section directly to the Setup sidebar navigation. Define your own list of frequently-used Setup pages — labels and URLs — and access them with one click from anywhere in Setup. Shortcuts are managed from the extension options page and support drag-to-reorder.

When this feature is enabled, a pin icon appears next to each item in the Setup sidebar when you hover over it. Click the pin to instantly add that page to your shortcuts without leaving the page. Click again to remove it. The shortcuts section updates immediately.

**Process Builder**
Adds several enhancements to the Process Builder interface: drag to resize the criteria/action panel so you can see more at once, one-click copy buttons on text fields so you can grab values without selecting text manually, and full API names displayed in field selection modals instead of truncated labels.

**User Search**
Adds a user search button directly to the search bar on both Lightning and Setup pages. Search for any user by name, username, or email — including deactivated users that Salesforce's built-in search ignores. Results show the user's name, username, and an Active or Inactive badge. Click any result to navigate directly to their user record.

### Snippets

**Snippets**
Store frequently used formulas, SOQL queries, and notes for quick access. Snippets are managed from the extension options page — add a label and the content you want to save, then click Copy to instantly copy the full text to your clipboard. Snippets save immediately when added, removed, or reordered and are always one click away.
