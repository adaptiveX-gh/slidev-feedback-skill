# GitHub Import Guide - Slidev Feedback Skill

## How the Import System Works

The Amagen GitHub import uses a **two-phase approach**:

### Phase 1: Frontend Detection (Preview)
**File:** `apps/railway-client/src/utils/GitHubSkillFetcher.ts`

1. User enters GitHub URL in import wizard
2. Frontend fetches `SKILL.md` from repository
3. Parses YAML frontmatter for metadata
4. Shows skill preview with:
   - Name, description, icon
   - 8 detected parameters
   - Category and tags
5. User reviews and clicks "Import"

✅ **Your package has SKILL.md** - Frontend detection will work!

### Phase 2: Backend Import (Full Package)
**File:** `apps/railway-backend/src/utils/github-package-fetcher.ts`

1. Backend receives import request
2. Fetches **entire repository tree** via GitHub API
3. Downloads **all 25 files**:
   - All `.tsx` component files
   - All `.ts` handler files
   - Durable Object implementation
   - package.json, tsconfig.json
   - README, LICENSE, EXAMPLES.md
   - Everything except node_modules/
4. Uploads files to Supabase Storage
5. Creates skill record in database
6. Detects dependencies from package.json

✅ **Your package has all implementation files** - Backend import will work!

## Package Structure Ready for Import

```
slidev-feedback-skill/
├── SKILL.md                    ✅ Frontend detection file
├── package.json                ✅ NPM metadata + amagen config
├── src/
│   ├── manifest.ts             ✅ ISkill implementation
│   ├── constants.ts            ✅ Configuration constants
│   ├── types.ts                ✅ TypeScript types
│   ├── index.ts                ✅ Main export
│   ├── components/             ✅ React components
│   │   ├── FeedbackWidget.tsx      (349 lines)
│   │   ├── PresenterDashboard.tsx  (445 lines)
│   │   ├── ConfigCreator.tsx       (507 lines)
│   │   └── SettingsPanel.tsx       (existing)
│   ├── handlers/               ✅ Server functions
│   │   ├── create.ts
│   │   ├── execute.ts
│   │   ├── analytics.ts
│   │   ├── export.ts
│   │   └── realtime.ts
│   └── durable-objects/        ✅ Cloudflare DO
│       └── SlidevFeedbackDO.ts
├── scripts/
│   └── post-build.js           ✅ Build script
├── tsconfig.json               ✅ TypeScript config
├── wrangler.toml               ✅ Cloudflare config
├── LICENSE                     ✅ MIT license
├── .gitignore                  ✅ Git ignore rules
├── README.md                   ✅ Documentation
├── EXAMPLES.md                 ✅ Usage examples
└── IMPORT_VERIFICATION.md      ✅ Verification report

Total: 25 files, 242.54 KB
```

## Import Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: FRONTEND DETECTION                                │
│  (GitHubSkillFetcher)                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
         User enters: github.com/USER/REPO
                            │
                            ▼
              Fetch: SKILL.md from repo
                            │
                            ▼
           Parse: YAML frontmatter
           ├── id: slidev-feedback
           ├── name: Slidev Real-time Feedback
           ├── 8 parameters detected
           └── category: engagement
                            │
                            ▼
              Show preview in wizard
                            │
                            ▼
         User clicks "Import Skill"
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: BACKEND IMPORT                                    │
│  (GitHubPackageFetcher + SkillPackageImporter)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
    POST /api/skill-packages/import
    {
      github_url: "...",
      user_id: "...",
      import_options: {...}
    }
                            │
                            ▼
         Parse GitHub URL
         owner: USER
         repo: REPO
         branch: main
                            │
                            ▼
    Fetch entire repository tree
    (GitHub API: /git/trees/:sha?recursive=1)
                            │
                            ▼
       Download all 25 files
       ├── src/components/*.tsx     ✅
       ├── src/handlers/*.ts        ✅
       ├── src/durable-objects/*.ts ✅
       ├── package.json             ✅
       └── ... (all other files)    ✅
                            │
                            ▼
        Validate package
        ├── Check file security      ✅
        ├── Scan for malware         ✅
        └── Verify package.json      ✅
                            │
                            ▼
       Create skill record
       INSERT INTO skills (
         id,
         user_id,
         name: "Slidev Real-time Feedback",
         plugin_id: "slidev-feedback",
         category: "engagement",
         ...
       )
                            │
                            ▼
    Upload files to Supabase Storage
    ├── skills/SKILL_ID/src/components/FeedbackWidget.tsx
    ├── skills/SKILL_ID/src/components/PresenterDashboard.tsx
    ├── skills/SKILL_ID/src/handlers/create.ts
    └── ... (all 25 files)
                            │
                            ▼
      Record file metadata
      INSERT INTO skill_files (
        skill_id,
        file_path,
        size_bytes,
        mime_type,
        storage_path
      )
                            │
                            ▼
      Detect dependencies
      FROM package.json:
      ├── zod: ^3.22.4
      ├── hono: ^3.11.0
      ├── framer-motion: ^10.16.0
      └── ... (7 total)
                            │
                            ▼
   Record dependencies
   INSERT INTO skill_dependencies (...)
                            │
                            ▼
   Update skill metadata
   UPDATE skills SET
     dependency_hash = "...",
     storage_path = "skills/SKILL_ID",
     github_last_synced = NOW()
                            │
                            ▼
       Create version snapshot
       (optional)
                            │
                            ▼
   ┌────────────────────────────────┐
   │  ✅ IMPORT COMPLETED           │
   │  Skill ID: skill_xxx           │
   │  Files: 25                     │
   │  Size: 242.54 KB               │
   │  Status: Ready                 │
   └────────────────────────────────┘
```

## Testing the Import

### 1. Push to GitHub

```bash
cd code-reviews/slidev-feedback-skill

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Slidev Real-time Feedback skill"

# Add remote (replace with your repo)
git remote add origin https://github.com/YOUR_USERNAME/slidev-feedback-skill.git

# Push
git push -u origin main
```

### 2. Import in Amagen Dashboard

**URL to use:**
```
https://github.com/YOUR_USERNAME/slidev-feedback-skill
```

**Expected Frontend Detection:**
- ✅ Skill name: "Slidev Real-time Feedback"
- ✅ Icon: 📊
- ✅ Category: Engagement
- ✅ Parameters detected: 8
  1. presentationTitle (string)
  2. totalSlides (number)
  3. allowedReactions (array)
  4. enableQuestions (boolean)
  5. requireAuth (boolean)
  6. sessionDuration (number)
  7. moderateQuestions (boolean)
  8. theme (string)

**Expected Backend Import:**
- ✅ Fetch all 25 files
- ✅ Validate package security
- ✅ Create skill record
- ✅ Upload to Supabase Storage
- ✅ Detect 7 dependencies
- ✅ Set status to "ready"

### 3. Verify Import Success

After import, check:
1. **My Skills page** - Skill appears in list
2. **Skill detail** - Click to see metadata
3. **Files uploaded** - 25 files in storage
4. **Dependencies** - 7 detected
5. **Create Widget** - Button enabled (costs 10 credits)

## Troubleshooting

### Issue: "Skill definition file not found"

**Cause:** SKILL.md is missing or in wrong format

**Fix:** Verify SKILL.md exists in repository root with valid YAML frontmatter

### Issue: "Package validation failed"

**Cause:** Security issues or malformed files

**Fix:** Run local validation:
```bash
npx tsx scripts/verify-skill-package.ts "code-reviews/slidev-feedback-skill"
```

### Issue: "Failed to fetch from GitHub"

**Cause:** Repository is private or GitHub rate limit

**Fix:**
- Make repository public, OR
- Add GitHub access token in Amagen settings

### Issue: "Import succeeded but skill doesn't work"

**Cause:** Missing implementation files or incorrect manifest

**Fix:**
1. Check that all 25 files were uploaded
2. Verify manifest.ts is valid TypeScript
3. Check console for runtime errors

## What Gets Imported

### ✅ Files Uploaded (25 total)

**Source Code (TypeScript/TSX):**
- src/components/FeedbackWidget.tsx
- src/components/PresenterDashboard.tsx
- src/components/ConfigCreator.tsx
- src/components/SettingsPanel.tsx
- src/handlers/create.ts
- src/handlers/execute.ts
- src/handlers/analytics.ts
- src/handlers/export.ts
- src/handlers/realtime.ts
- src/durable-objects/SlidevFeedbackDO.ts
- src/manifest.ts
- src/constants.ts
- src/types.ts
- src/index.ts

**Configuration:**
- package.json
- tsconfig.json
- wrangler.toml
- .gitignore
- .npmrc

**Documentation:**
- README.md
- SKILL.md
- EXAMPLES.md
- PACKAGE_README.md
- IMPORT_VERIFICATION.md

**Build Scripts:**
- scripts/post-build.js

**Legal:**
- LICENSE

### ❌ Files NOT Uploaded

- node_modules/ (excluded by .gitignore)
- .git/ (Git metadata)
- dist/ (build output - will be built on platform)
- Any files in .gitignore

## Post-Import Verification

After successful import, you can:

### 1. View Skill Details
```
GET /api/skills/:skillId
```

Response includes:
- Skill metadata
- File count: 25
- Storage path: skills/:skillId/
- Dependencies: 7

### 2. List Uploaded Files
```
GET /api/skill-packages/:skillId/files
```

Response shows all 25 files with:
- file_path
- size_bytes
- mime_type
- storage_path

### 3. Create Widget Instance
```
POST /api/widgets/create
{
  skillId: ":skillId",
  configuration: {
    presentationTitle: "My Talk",
    totalSlides: 30,
    allowedReactions: ["👍", "❤️", "🔥"],
    ...
  }
}
```

Cost: 10 credits
Returns: Widget ID, embed code, QR code

## Success Criteria

Your import is successful when:

- ✅ Skill appears in "My Skills"
- ✅ All 25 files show in file list
- ✅ 7 dependencies detected
- ✅ "Create Widget" button works
- ✅ Widget creation costs 10 credits
- ✅ Embed code generated successfully
- ✅ QR code generated successfully
- ✅ Widget loads in iframe without errors

## Next Steps After Import

1. **Test Widget Creation**
   - Create a test widget
   - Verify embed code works
   - Test QR code access

2. **Test Components**
   - Test FeedbackWidget in iframe
   - Test PresenterDashboard in dashboard
   - Test ConfigCreator in widget creation flow

3. **Verify Durable Object**
   - Test real-time WebSocket connections
   - Verify slide synchronization
   - Test reaction broadcasting

4. **Share with Users**
   - Publish to Amagen marketplace (optional)
   - Share GitHub repository
   - Create tutorial videos

---

**Package Status:** ✅ **READY FOR GITHUB IMPORT**

All 25 files are present and validated. The package includes both the SKILL.md definition file for frontend detection AND the complete implementation for backend import.
