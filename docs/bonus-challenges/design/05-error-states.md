# Bonus 5: Improve Error & Empty States ⭐

**Difficulty:** Easy

---

## Goal

Create delightful error and empty states that help users understand what went wrong and what to do next.

---

## What to Improve

### Error States

- User-friendly error messages (not technical jargon)
- Clear next steps or actions to take
- Visual feedback (icons, colors)
- "Try Again" or "Go Back" options

### Empty States

- Show when lists are empty
- Explain why it's empty
- Clear call-to-action ("Create your first campaign")
- Consider illustrations or icons
- Make it inviting, not boring

### Loading States

- Skeleton screens instead of spinners
- Show structure of upcoming content
- Smooth transitions from loading to loaded

---

## Examples

### Empty State

```jsx
{
  campaigns.length === 0 && (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📢</div>
      <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
      <p className="text-gray-600 mb-4">Create your first campaign to get started</p>
      <button className="btn-primary">Create Campaign</button>
    </div>
  );
}
```

### Error Message

```jsx
{
  error && (
    <div className="bg-red-50 border border-red-200 rounded p-4">
      <p className="text-red-800 font-medium">Unable to load campaigns</p>
      <p className="text-red-600 text-sm mt-1">Please check your connection and try again</p>
      <button onClick={retry} className="mt-3 text-red-700 underline">
        Try Again
      </button>
    </div>
  );
}
```

---

## What We're Looking For

Candidates who:

- Think about edge cases
- Create helpful, human-friendly messaging
- Use visual design to guide users
- Make frustrating moments less painful

---

[← Back to Bonus Challenges](../README.md)
