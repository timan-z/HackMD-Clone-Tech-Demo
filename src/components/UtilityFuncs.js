import { $isParagraphNode, $isTextNode } from 'lexical';
/* 
Functions I want to invoke across all my components (but mainly Editor.jsx and Toolbar.jsx).
*/

// Function for finding the (absolute) cursor index position within the text editor (only called when cursor is present within the editor space):
export function findCursorPos(paraNodes, anchorNode, anchorOffset) {
    //console.log("~~~Code Button Clicked (CBC) console.log statements BEGIN (mainly of relevance if no text is highlighted)~~~");

    /* NOTE: anchorOffset is key to determining the absolute cursor position (ACP) in the text editor (its index position in the overall text display),
    but its use will depend on if anchorNode is a TextNode or not. If it does, anchorOffset gives the position of the cursor within the current
    text-editor line (a non-empty text line). Otherwise, the cursor position is on an empty line and anchorOffset's value is less immediately useful,
    but can still be used to determine ACP. */
    /*if($isTextNode(anchorNode)) {
        console.log("CBC: Anchor Node is a Text Node. The cursor is within a text line.");
    } else {
        console.log("CBC: Anchor Node is not a Text Node. The cursor is within an empty line.");
    }*/

    /* Lexical does not store its text-editor content as a single string, rather it partitions its content into various paragraph nodes 
    (see param "paraNodes"), which can be iterated through and inspected (for its child nodes, which are mostly TextNodes and LineBreakNodes). 
    It also does not provide explicit functions for returning specific line contents so some logic is required to extract the ACP with what is known. */

    // Variables for ACP calculation:
    let cursorPosition = 0;
    let absolutePosition = 0;
    let nodeCount = 0;
    let textNodeCount = 0;
    let lineBreakNodeC = 0;
    let keyMatch = false;

    // This if-condition is for when the cursor position is on an empty line that comprises the whole text editor (ACP is 0, no further calculations needed).
    if(!(!$isTextNode(anchorNode) && anchorOffset === 0)) {

        // NOTE: Lexical appears to always (?) store its text-editor content in *one* specific paragraph node.
        for(const paragraph of paraNodes) {

            /* EDIT: Need this if-condition below because of the cursor renders...
            (Basically, when I insert a custom node into the Node Tree of Lexical, there will be times my UseEffect hook activates
            this function which leads to a null paraNodes being sent in, or something like that, which will cause errors). */
            if(!$isParagraphNode(paragraph)) {
                return;
            }

            if(paragraph.getChildren()) {
                const paraChildren = paragraph.getChildren();

                /* Throughout the paragraph node iteration, as its children are inspected, a count is kept of nodes traversed.
                This is important for ACP calculation and determining when traversal should stop based on the values passed as arguments
                (this is how we determine at what point we "meet" the line in which the cursor position was positioned). */
                for(let i = 0; i < paraChildren.length; i++) {
                    nodeCount += 1;
                    const paraChild = paraChildren[i];

                    if($isTextNode(paraChild)) {
                        textNodeCount += 1;

                        /* When anchorNode is a TextElement, then anchorNode.getKey() will have the same key value as the TextNode which 
                        refers to the text line in which the cursor position was positioned. */
                        if(anchorNode.getKey() === paraChild.getKey()) {
                            // anchorOffset will be line index and lineBreakNodeC will be all the prior \n characters traversed. (These aren't stored in TextNodes).
                            cursorPosition += (anchorOffset + lineBreakNodeC);
                            keyMatch = true;
                            break;  // stop traversal.
                        }
                        cursorPosition += paraChild.getTextContent().length;
                    } else {
                        lineBreakNodeC += 1;
                    }

                    /* When anchorNode is not a text node (cursor on empty line), the value of anchorOffset will refer not to
                    line index, but the newline depth of the cursor (this will correspond with nodeCount): */
                    if(!$isTextNode(anchorNode)) {
                        if(nodeCount === anchorOffset) {
                            break;   // stop traversal.
                        }
                    }
                }
            }
        }
    }

    //console.log("CBC: The cursor position is currently on line: ", (lineBreakNodeC + 1));
    
    // Calculating and returning the final absolute cursor position:
    if(keyMatch === true) {                
        absolutePosition = cursorPosition;
    } else {
        absolutePosition = cursorPosition + (anchorOffset - textNodeCount);
    }

    //console.log("CBC: The absolute cursor position in the text editor is: ", absolutePosition);
    //console.log("~~~Code Button Clicked (CBC) console.log statements END~~~");
    return absolutePosition;
}


