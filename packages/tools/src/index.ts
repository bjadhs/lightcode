export { readFileTool } from "./read-file"
export { writeFileTool } from "./write-file"
export { listDirectoryTool } from "./list-directory"
export { searchFilesTool } from "./search-files"
export { editFileTool } from "./edit-file"
export { executeCommandTool } from "./execute-command"

import { readFileTool } from "./read-file"
import { writeFileTool } from "./write-file"
import { listDirectoryTool } from "./list-directory"
import { searchFilesTool } from "./search-files"
import { editFileTool } from "./edit-file"
import { executeCommandTool } from "./execute-command"

export const tools = {
  read_file: readFileTool,
  write_file: writeFileTool,
  list_directory: listDirectoryTool,
  search_files: searchFilesTool,
  edit_file: editFileTool,
  execute_command: executeCommandTool,
} as const

export type ToolName = keyof typeof tools
