export default function LoadingSpinner({ size = 'md', fullPage = false }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  }

  const spinner = (
    <div className={`${sizes[size]} rounded-full border-slate-900 border-t-indigo-500 animate-spin`} />
  )

  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-64">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  )
}
