'use client';
import { useParams } from 'next/navigation';

export default function AssignmentPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">TEST PAGE WORKS!</h1>
      <p>ID from URL: {id}</p>
      <p>ID Type: {id?.startsWith('SUB_') ? 'Submission ID' : 'Assignment ID'}</p>
    </div>
  );
}
