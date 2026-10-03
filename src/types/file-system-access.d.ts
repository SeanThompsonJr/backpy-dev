// The parts of the File System Access API (Chrome and Edge) that VS Code sync uses.
// TypeScript's DOM types don't include them yet.

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite'
}

interface FileSystemHandle {
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
}

interface DirectoryPickerOptions {
  id?: string
  mode?: 'read' | 'readwrite'
  startIn?: 'desktop' | 'documents' | 'downloads' | FileSystemHandle
}

interface Window {
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>
  /** e2e tests swap the folder picker for one that returns a test folder (the browser's private file system). */
  __backpyPickFolder?: () => Promise<FileSystemDirectoryHandle>
  /** e2e tests record vscode:// links here instead of opening VS Code. */
  __backpyOpenUrl?: (url: string) => void
}
