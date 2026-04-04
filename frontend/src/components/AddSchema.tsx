type ChildProps = {
  setAddSchema: React.Dispatch<React.SetStateAction<boolean>>;
};

const AddSchema = ({ setAddSchema }: ChildProps) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Add Schema</div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: 'var(--color-text-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => setAddSchema(false)}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Paste your database schema so GenSQL can generate accurate queries.</p>
        <textarea
          rows={8}
          name="schema"
          placeholder={"CREATE TABLE users (\n  id INT PRIMARY KEY,\n  name VARCHAR(100),\n  email VARCHAR(255)\n);"}
          className="w-full p-3 border outline-none rounded-lg font-mono text-sm mb-4 resize-y"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', background: 'var(--color-bg-input)' }}
        />
        <div className="flex justify-end gap-3">
          <button
            className="px-5 py-2 rounded-lg text-sm font-medium cursor-pointer border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={() => setAddSchema(false)}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded-lg text-sm font-medium cursor-pointer"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
            onClick={() => setAddSchema(false)}
          >
            Save Schema
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddSchema
