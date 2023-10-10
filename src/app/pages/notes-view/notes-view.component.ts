import { Component, OnInit } from '@angular/core';
import { NoteService } from 'src/app/note.service';
import { ActivatedRoute, Params, Route, Router } from '@angular/router';
import { List } from 'src/app/models/list.model';
import { Note } from 'src/app/models/note.model';
import { subscribeOn } from 'rxjs';

@Component({
  selector: 'app-notes-view',
  templateUrl: './notes-view.component.html',
  styleUrls: ['./notes-view.component.scss']
})
export class NotesViewComponent implements OnInit {
  lists: List[] = [];
  notes: Note[] = [];

  selectedListId!: string;

  constructor(private noteService: NoteService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      if(params['listId']){
        this.selectedListId = params['listId'];
        this.noteService.getNotes(params['listId'])?.subscribe(
          (notes: any) => {
          this.notes = notes;
        }
      )
    }else{  
      this.notes =[];
      
    }
  }
    )

    this.noteService.getLists()?.subscribe((lists: any) => {
        this.lists = lists;
      }
    );
  }

  onNoteClick(note: Note) {
    this.noteService.complete(note).subscribe(() => {
        console.log("Completed successfully");
        note.completed = !note.completed;
      },
      (error: any) => {
        console.error(error);
      })
  }

  onDeleteListClick(){
    this.noteService.deleteList(this.selectedListId).subscribe((res: any) => {
      this.router.navigate(['lists']);
      console.log(res);
    });
  }


  onDeleteNoteClick(id: string) {
    this.noteService.deleteNote(this.selectedListId, id).subscribe((res: any) => {
      this.notes = this.notes.filter(val => val._id !== id);
      console.log(res);
    })
  }

}
