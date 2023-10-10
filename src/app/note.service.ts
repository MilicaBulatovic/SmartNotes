import { Injectable } from '@angular/core';
import { WebRequestService } from './web-request.service';
import { Note } from './models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {

  constructor(private webReqService: WebRequestService) { } 

getLists() {
  return this.webReqService.get('lists');
  
}

createList(title: string) {
  return  this.webReqService.post('lists', { title });
}

deleteList(id: string) {
  return this.webReqService.delete(`lists/${id}`);
}


getNotes(listId: string) {
  return this.webReqService.get(`lists/${listId}/notes`);
}

updateList(id: string, title: string) {
  // We want to send a web request to update a list
  return this.webReqService.patch(`lists/${id}`, { title });
}

updateNote(listId: string, noteId: string, title: string) {
  // We want to send a web request to update a list
  return this.webReqService.patch(`lists/${listId}/notes/${noteId}`, { title });
}

deleteNote(listId: string, noteId: string) {
  return this.webReqService.delete(`lists/${listId}/notes/${noteId}`);
} 

createNote(title: string, listId: string) {
  return  this.webReqService.post(`lists/${listId}/notes`, { title });
 }
 
 complete(note: Note) {
  return this.webReqService.patch(`lists/${note._listId}/notes/${note._id}`,{
    completed: !note.completed
  });
 }
}