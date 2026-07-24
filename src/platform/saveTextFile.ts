export type SaveTextFileResult = 'saved' | 'cancelled' | 'downloaded';

const invalidFileNameCharacters = /[<>:"/\\|?*]/g;
const replaceControlCharacters = (value: string) =>
  Array.from(value, (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 ? '_' : character).join('');

export const createSaveFileName = (petName: string, now = Date.now()) => {
  const date = new Date(now);
  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  const cleanPetName = petName
    .normalize('NFKC')
    .replace(invalidFileNameCharacters, '_');
  const safePetName = replaceControlCharacters(cleanPetName)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48) || 'PetPet';
  return `${safePetName}-${dateKey}-petpet-save.petpet`;
};

const downloadTextFile = (fileName: string, text: string) => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const saveTextFile = async (fileName: string, text: string): Promise<SaveTextFileResult> => {
  if (!('__TAURI_INTERNALS__' in window)) {
    downloadTextFile(fileName, text);
    return 'downloaded';
  }

  const [{ save }, { writeTextFile }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs'),
  ]);
  const destination = await save({
    defaultPath: fileName,
    filters: [{ name: 'PetPet Save', extensions: ['petpet'] }],
  });

  if (!destination) return 'cancelled';

  await writeTextFile(destination, text);
  return 'saved';
};
