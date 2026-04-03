## 🎯 Quick Fix Guide for Merged Code Issues

### Issue Description
During form page refactoring, some files (surat-domisili, surat-janda, surat-penghasilan) have mixed old and new code.  
This causes syntax errors at the end of files.

### ✅ Solution: Clean File Content

For each affected file, **delete everything after the last `}`** of the component.

**Files to clean:**
1. `src/app/permohonan/surat-domisili/form/page.tsx`
2. `src/app/permohonan/surat-janda/form/page.tsx`
3. `src/app/permohonan/surat-penghasilan/form/page.tsx`

### 🔧 Manual Fix Steps (VS Code)

1. **Open file** (e.g., surat-domisili/form/page.tsx)
2. **Find the last closing brace** `}` that closes the main component function
   - Should be around line 120-150 (after the closing `</>` of return statement)
3. **Delete everything after that closing brace**
   - The file should have remnant code like function definitions, old JSX, etc.
   - Delete from line 151 onwards
4. **Save file**
5. **Repeat for other 2 files**

### ✍️ PowerShell Command (Automated)

If you want to automate the cleanup:

```powershell
# Run this in PowerShell from project root
$files = @(
    "src/app/permohonan/surat-domisili/form/page.tsx",
    "src/app/permohonan/surat-janda/form/page.tsx",
    "src/app/permohonan/surat-penghasilan/form/page.tsx"
)

# This will find where component ends and truncate
foreach ($file in $files) {
    $content = Get-Content -Path $file -Raw
    # Find last closing parenthesis + closing brace of component
    $lastBrace = $content.LastIndexOf("  }") + 3
    if ($lastBrace -gt 2) {
        $cleaned = $content.Substring(0, $lastBrace)
        Set-Content -Path $file -Value $cleaned -Encoding UTF8
        Write-Host "✓ Cleaned $file"
    }
}
```

### 📋 Expected Final Structure

After cleanup, each form file should look like:

```typescript
"use client";
import ... // ~top 8-10 lines

const OPTIONS = [...]; // ~5-15 lines

export default function FormPage() {
  const { loading, error, handleSubmit } = usePermohonanSubmit();

  const onSubmit = async (e) => {
    // ... form submission logic ~15-20 lines
  };

  return (
    // JSX ~80-100 lines
  );
}
// FILE ENDS HERE - no more code after this closing brace!
```

### ✨ Verification

After cleanup, run:
```bash
npm run lint
```

Should show no errors in those 3 files.

