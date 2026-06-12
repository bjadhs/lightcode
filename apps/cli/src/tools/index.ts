import type { ToolName } from "@lightcode/tools"
import { readFile } from "./read-file"
import { writeFile } from "./write-file"
import { listDirectory } from "./list-directory"
import { searchFiles } from "./search-files"
import { editFile } from "./edit-file"
import { executeCommand } from "./execute-command"

export { guardPath } from "./guard"

export async function executeTool(name: ToolName, input: unknown): Promise<string> {
  switch (name) {
    case "read_file":
      return readFile(input as Parameters<typeof readFile>[0])
    case "write_file":
      return writeFile(input as Parameters<typeof writeFile>[0])
    case "list_directory":
      return listDirectory(input as Parameters<typeof listDirectory>[0])
    case "search_files":
      return searchFiles(input as Parameters<typeof searchFiles>[0])
    case "edit_file":
      return editFile(input as Parameters<typeof editFile>[0])
    case "execute_command":
      return executeCommand(input as Parameters<typeof executeCommand>[0])
  }
}
