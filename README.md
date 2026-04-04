# Salesforce Lightning Admin Enhancer

Productivity enhancements for Salesforce Lightning admins. Record lookup by ID, Setup shortcuts, Quick Find improvements, and more.

All features can be toggled on or off individually from the extension options page.

---

## Features

### Lightning

**Clickable Logo**
The Salesforce logo in the Lightning header does nothing by default. This feature makes it clickable — opening your Lightning home page in a new tab. A small change that saves time when you need to quickly jump back to home without losing what you're working on.

**Launch by ID**
Adds a record ID input field next to the Lightning search bar. Paste any 15 or 18-digit Salesforce record ID and press Enter to navigate directly to that record. Useful when you have an ID from a support case, a data export, a debug log, or a URL shared by a colleague — no searching required.

**App Switcher Return**
When you switch apps using the Salesforce App Launcher, you're dropped on the new app's home page and lose your place. With this feature enabled, the extension remembers the record you were viewing and either automatically redirects you back to it, or shows a dismissible banner with a link. Choose your preferred behavior — auto-redirect or show prompt — from the options page.

**Login As Return**
When an admin logs out of a Login As session, Salesforce returns them to the Users list instead of the user they were just viewing. With this feature enabled, the extension automatically redirects back to that user's detail page in Setup after logging out.

**Record ID Display**
Shows the current record ID in the Lightning header on any record page — click to copy to clipboard. Updates automatically as you navigate between records.

### Setup

**Org ID Display**
Displays your organization's 18-digit Org ID directly in the Setup header. Click it to copy to clipboard. Saves you from having to navigate to Company Information every time you need your Org ID for a support ticket, API configuration, connected app setup, or package installation.

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

### Snippets

**Snippets**
Store frequently used formulas, SOQL queries, and notes for quick access. Snippets are managed from the extension options page — add a label and content, then click Copy to instantly copy the full text to your clipboard. Snippets save immediately when added, removed, or reordered.

