# Add a project

Create `content/projects/<id>.yaml`:

```yaml
id: my-tool
title: my-tool
repository: v1cferr/my-tool # optional; linked only while GitHub lists it as public
state: active # active | maintained | stable | experimental | paused | historical | archived
category: personal # personal | professional | academic | study | challenge
featured: false
startedAt: 2027-03 # optional; without it the timeline uses the repository creation date, labelled
summary:
  en-us: What it is, in one or two sentences.
problem:
  en-us: What it solves.
learnings: { en-us: [] }
technologies: [python]
experiences: [] # experience ids it came from
links: [{ label: Demo, url: "https://...", kind: demo }]
```

`state` is an editorial decision. Do not infer it from the last push. Public
repositories that have no file here still appear under "More public
repositories", marked as not curated.
