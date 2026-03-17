import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface TemplateSuratProps {
  template: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

export default function TemplateSurat({ template, onChange, readOnly = false }: TemplateSuratProps) {
  const modules = {
    toolbar: readOnly ? false : [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="template-editor">
      <ReactQuill
        theme="snow"
        value={template}
        onChange={onChange}
        modules={modules}
        readOnly={readOnly}
      />
    </div>
  );
}
