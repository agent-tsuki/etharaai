export function initTheme() {
  const saved = localStorage.getItem('theme')
  // Default to 'dark' for this app since the initial design is dark
  const theme = saved || 'dark'
  if (theme === 'light') {
    document.documentElement.classList.add('light')
  } else {
    document.documentElement.classList.remove('light')
  }
}

export function toggleTheme() {
  const current = document.documentElement.classList.contains('light') ? 'light' : 'dark'
  const next = current === 'light' ? 'dark' : 'light'
  if (next === 'light') {
    document.documentElement.classList.add('light')
  } else {
    document.documentElement.classList.remove('light')
  }
  localStorage.setItem('theme', next)
  return next
}

export function getTheme() {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark'
}
