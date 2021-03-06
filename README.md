# document-versions-service

Microservice providing custom actions on document versions and related entities.

## Getting started
### Add the service to a stack
Add the following snippet to your `docker-compose.yml`:

```yml
document-versions:
  image: kanselarij/document-versions-service
```

## Reference
### API
#### PUT /agendaitems/:id/documents
Add a document to the collection of documents of an agendaitem. If the agendaitem already contains a previous version of the document -copied from the previous agenda on agenda approval- the previous version(s) gets replaced with the new version. Otherwise the new version is just added to the agendaitem's document collection.

Example request body

```json
{
  "data": {
    "type": "documents",
    "id": "49c54702-c108-43f6-8f14-936427271878"
  }
}
```

#### PUT /agendaitems/:id/pieces/restore
Add a document to the collection of documents of an agendaitem. If the agendaitem already contained a new version of the document added the agendaitem after agenda approval- the previous version(s) gets restored when deleting the new version. Only if the deletion would mean that the last piece linking a document-container and an agendaitem is being deleted.
