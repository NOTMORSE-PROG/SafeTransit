/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Script to fix TypeScript type assertions in repository files
const fs = require('fs');
const path = require('path');

function addTypeAssertions(content, returnType, isArray = false) {
  const typeAssertion = isArray ? ` as ${returnType}[]` : ` as ${returnType}`;

  // Pattern 1: return result[0]
  content = content.replace(
    new RegExp(`return result\\[0\\]( \\|\\| null)?;`, 'g'),
    (match, nullish) => {
      if (match.includes('?.')) return match;
      return `return (result[0]${nullish || ''})${typeAssertion};`;
    }
  );

  // Pattern 2: return await sql`...`
  content = content.replace(
    /return await sql`([^`]+)`/g,
    (match, query) => {
      return `return (await sql\`${query}\`)${typeAssertion}`;
    }
  );

  // Pattern 3: const result = ... return result[0]
  content = content.replace(
    /const result = await sql`([^`]+)`;\s+return result\[0\]( \|\| null)?;/g,
    (match, query, nullish) => {
      return `const result = await sql\`${query}\`;\n    return (result[0]${nullish || ''})${typeAssertion};`;
    }
  );

  return content;
}

// Fix userRepository
let userContent = fs.readFileSync('services/repositories/userRepository.ts', 'utf8');
userContent = userContent.replace(/await sql`/g, 'await sql`');
userContent = userContent.replace(/result\[0\]/g, 'result[0] as User');
userContent = userContent.replace(/result\[0\] as User as User/g, 'result[0] as User');
userContent = userContent.replace(/: Promise<User> \{[\s\S]*?return result\[0\] as User;/g, (match) => {
  return match;
});
userContent = userContent.replace(/PasswordResetToken\[\]>\`/g, 'PasswordResetToken[]>`');
userContent = userContent.replace(/return result\[0\] as User \|\| null/g, 'return (result[0] as User) || null');
userContent = userContent.replace(/\(result as any\)\.count/g, '(result as any).count');
fs.writeFileSync('services/repositories/userRepository.ts', userContent, 'utf8');

// Fix tipsRepository
let tipsContent = fs.readFileSync('services/repositories/tipsRepository.ts', 'utf8');
tipsContent = tipsContent.replace(/return await sql`([^`]+)`/g, 'return (await sql`$1`) as Tip[]');
tipsContent = tipsContent.replace(/return result\[0\]/g, 'return result[0] as Tip');
tipsContent = tipsContent.replace(/\(result as any\)\.count/g, '(result as any).count');
fs.writeFileSync('services/repositories/tipsRepository.ts', tipsContent, 'utf8');

// Fix familyRepository
let familyContent = fs.readFileSync('services/repositories/familyRepository.ts', 'utf8');
familyContent = familyContent.replace(/return result\[0\](?! as)/g, 'return result[0] as Family');
familyContent = familyContent.replace(/return result\[0\] \|\| null/g, 'return (result[0] as Family) || null');
familyContent = familyContent.replace(/return await sql`([^`]+)` as Family/g, 'return (await sql`$1`) as Family[]');
familyContent = familyContent.replace(/: Promise<Family\[\]> \{[\s\S]*?return await sql/g, (match) => {
  return match.replace(/return await sql/g, 'return (await sql') + ') as Family[]';
});
familyContent = familyContent.replace(/: Promise<FamilyMember\[\]> \{[\s\S]*?return await sql/g, (match) => {
  return match.replace(/return await sql/g, 'return (await sql') + ') as FamilyMember[]';
});
familyContent = familyContent.replace(/: Promise<FamilyLocation\[\]> \{[\s\S]*?return await sql/g, (match) => {
  return match.replace(/return await sql/g, 'return (await sql') + ') as FamilyLocation[]';
});
familyContent = familyContent.replace(/return result\[0\];(?=\s+\})/g, 'return result[0] as FamilyMember;');
familyContent = familyContent.replace(/\(result as any\)\.count/g, '(result as any).count');
fs.writeFileSync('services/repositories/familyRepository.ts', familyContent, 'utf8');

console.log('✅ All repository files fixed with proper type assertions!');
