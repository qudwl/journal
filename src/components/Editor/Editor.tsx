import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { useEffect } from "react";
import { useComputedColorScheme } from "@mantine/core";

interface EditorProps {
    initialContent?: string;
    onSave: (content: string) => void;
    onFocus?: () => void;
}

export function Editor({ initialContent, onSave, onFocus }: EditorProps) {
    const colorScheme = useComputedColorScheme('light');

    // Create a new editor instance
    const editor = useCreateBlockNote({
        initialContent: initialContent && initialContent !== '[]' ? JSON.parse(initialContent) : undefined,
    });

    useEffect(() => {
        if (editor) {
            const verifyContent = async () => {
                // Nothing specific needed here unless we want to reset content when initialContent changes
            }
            verifyContent();
        }
    }, [editor, initialContent]);

    return (
        <div onFocus={onFocus} style={{ height: '100%', width: '100%' }}>
            <BlockNoteView
                editor={editor}
                theme={colorScheme === 'dark' ? 'dark' : 'light'}
                onChange={() => {
                    // Get blocks directly from document
                    onSave(JSON.stringify(editor.document));
                }}
            />
        </div>
    );
}