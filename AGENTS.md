<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/003-dashboard-ui-integration/plan.md`.
<!-- SPECKIT END -->

## HeroUI v3 API Guidelines
This project uses **HeroUI v3** (which migrated to React Aria components), NOT NextUI v2.
When implementing components from HeroUI, adhere to the v3 API constraints:
1. **Forms and Validation:** Use the `<Form>` wrapper for native HTML form validation. Use `<TextField>`, `<Label>`, and `<FieldError>` to compose accessible inputs, rather than passing `label` or `errorMessage` directly as props to `<Input>` (unless specifically required by an old component).
2. **Icons inside Inputs:** The v3 `Input` component **NO LONGER** supports `startContent` or `endContent` props directly.
   - Use the `<InputGroup>` component instead to compose prefixes/suffixes:
     ```tsx
     <TextField>
       <Label>Email</Label>
       <InputGroup>
         <InputGroup.Prefix><EnvelopeSimpleIcon /></InputGroup.Prefix>
         <InputGroup.Input type="email" />
       </InputGroup>
     </TextField>
     ```
3. **Button Variants:** HeroUI v3 buttons DO NOT have a `"shadow"`, `"faded"`, or `"flat"` variant.
   - Supported variants: `"primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "danger-soft"`.
   - Example: `<Button variant="primary">...</Button>`. Do NOT use `color="primary"`.

If in doubt, consult the HeroUI v3 documentation or grep the downloaded LLM documentation (e.g., `llms-components.txt` or `.mdx` files) for the correct API shape.

## Phosphor Icons Guidelines
This project uses `@phosphor-icons/react`. Note that the icon components now require the `Icon` suffix.
- Example: Use `<EnvelopeSimpleIcon />` instead of `<EnvelopeSimple />`.
- Example: Use `<LockKeyIcon />` instead of `<LockKey />`.
- Always append `Icon` to the component name when importing and rendering icons from this library.
