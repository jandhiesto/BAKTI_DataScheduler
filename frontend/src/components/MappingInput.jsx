import { useState } from 'react';

export default function MappingInput({ onMappingChange }) {
  // State untuk menyimpan list mapping (Key Sumber -> Key Tujuan)
  const [mappings, setMappings] = useState([{ sourceKey: '', destKey: '' }]);

  const handleAddRow = () => {
    setMappings([...mappings, { sourceKey: '', destKey: '' }]);
  };

  const handleRemoveRow = (index) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    setMappings(newMappings);
    onMappingChange(newMappings); // Kirim update ke parent component
  };

  const handleChange = (index, field, value) => {
    const newMappings = [...mappings];
    newMappings[index][field] = value;
    setMappings(newMappings);
    onMappingChange(newMappings); // Kirim update ke parent component
  };

  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <h3 className="font-semibold mb-3">Pemetaan Data (Data Mapping)</h3>
      
      {mappings.map((mapping, index) => (
        <div key={index} className="flex gap-3 mb-3 items-center">
          <input
            type="text"
            placeholder="Parameter Sumber (ex: kelas)"
            value={mapping.sourceKey}
            onChange={(e) => handleChange(index, 'sourceKey', e.target.value)}
            className="border p-2 rounded w-full"
          />
          <span className="text-gray-500 font-bold">➡️</span>
          <input
            type="text"
            placeholder="Parameter Tujuan (ex: class)"
            value={mapping.destKey}
            onChange={(e) => handleChange(index, 'destKey', e.target.value)}
            className="border p-2 rounded w-full"
          />
          {mappings.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveRow(index)}
              className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
            >
              Hapus
            </button>
          )}
        </div>
      ))}
      
      <button
        type="button"
        onClick={handleAddRow}
        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        + Tambah Pemetaan
      </button>
    </div>
  );
}