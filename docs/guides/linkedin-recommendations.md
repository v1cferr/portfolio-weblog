# LinkedIn recommendations

The recommendations on the home page and on About come from
`content/recommendations/<id>.yaml`, one file per recommender, named after them
(`julio-cesar-raveli.yaml`). LinkedIn is the source of the texts; everything
else on the cards is the owner's.

## Import or refresh them

1. On LinkedIn: **Settings → Data privacy → Get a copy of your data**, with
   **Recommendations** ticked (or the full archive). The download is a `.zip`.
2. Run, with the path to the `.zip` (or to `Recommendations_Received.csv`):

   ```sh
   pnpm linkedin:import ~/Downloads/Complete_LinkedInDataExport_<date>.zip
   ```

   It prints one line per recommender, `+` new, `~` updated, `=` unchanged, and
   never the texts. Nothing but the YAML files is written.

3. Review `git diff content/recommendations`, run `pnpm content:check`, commit.

The export holds personal data: keep it out of the repository.

## What the import owns

| Field                  | Owner  | Notes                                                            |
| ---------------------- | ------ | ---------------------------------------------------------------- |
| `name`                 | import | First and last name; the file name is its slug                   |
| `jobTitle`, `company`  | import | The recommender's current position, as LinkedIn exports it       |
| `date`                 | import | Creation date, in Brazil time (the export is in UTC)             |
| `text.<language>`      | import | The original, verbatim; paragraphs split at double spaces        |
| `visibility`           | import | `VISIBLE` is `public`, `HIDDEN` is `private`                     |
| `relation`             | owner  | Kind, the label in the owner's words, organization, job          |
| `excerpt`, `rank`      | owner  | The home page quote; the order of importance (first 3 on home)   |
| `text.<other locales>` | owner  | Translations; `translationStale: true` when the original changed |
| `photo`, `status`      | owner  | See below                                                        |

A new recommendation arrives as `status: draft` with a TODO comment: fill in
`relation`, a `rank`, an `excerpt`, the `en-us` translation, then set
`status: published`. When an original text changes, the import sets
`translationStale: true`: update the translation (and the excerpt, which
`content:check` holds to the text word for word), then delete the flag. A
recommendation missing from the export is left as it is.

## Photos

Only with the recommender's permission. Resize to 256×256, strip the metadata,
and save it as `apps/web/public/recommendations/<id>.jpg`, for example:

```sh
nix shell nixpkgs#imagemagick -c magick photo.jpg -auto-orient -resize 256x256^ \
  -gravity center -extent 256x256 -strip -quality 85 -interlace JPEG \
  apps/web/public/recommendations/<id>.jpg
```

Then set `photo: /recommendations/<id>.jpg` in the file. Without a photo the
card shows the recommender's initials.
