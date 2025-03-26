One creative choice I want to make to differentiate my project from HackMD is that when "> " precedes a line, that's Quote in effect. But when it's just ">" alone and then some other non-whitespace character follows it -- this won't be Quote in effect.
^ so quote will be interpeted as "> " in my editor. (This is different from what HackMD does).



 /* NOTE: So there's the issue of handling behavior when lines already start with "> " and then you highlight that line
                and click the Quote button... should I then undo the "> " starting the string? Well, the way HackMD handles it is that
                -- for mult-line highlighted text -- you stack the "> "s prepended to the string, and so I will handle it that way as well.
                (For single-line Quote invocations though, it seems HackMD will undo the "> " quotes). */

                ^ multi-line stuff, I won't undo the > things present. But single line I will! (HackMD does the same thing so idk).



^ also a new creative difference I can add is, in HackMd's numberedlist, when you highlight multiple lines and apply the button (it prepends "1." to all the lines -- but here I know how I can make them all numbered!)


another minor creative change is, after inserting table or line break (---), I'm moving the cursor position after their insertion (this is not the case
in HackMD -- the cursor position does not change at all -- but I don't think that really makes sense).


        // NOTE: Should probably make it so that Table Tools are only made active when selection = non-highlighted text... (creative choice).




Now, in editors like Google Docs, when there are several different clients editing a document, there is often a sort of pop-up next to their active cursor -- which is typically visible in the screen -- that indicates their name. I want to incorporate this into my site. I want to make it so that I can see the other client's cursor and a mini pop-up that shows their username (which can maybe just be their socket.id **for now**)



