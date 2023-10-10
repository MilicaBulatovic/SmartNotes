import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Note } from 'src/app/models/note.model';
import { NoteService } from 'src/app/note.service';

@Component({
  selector: 'app-new-note',
  templateUrl: './new-note.component.html',
  styleUrls: ['./new-note.component.scss']
})
export class NewNoteComponent implements OnInit {
  listId!: string;

  constructor(
    private noteService: NoteService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.listId = params['listId'];
    });
  }

  createNote(title: string) {
    this.noteService.createNote(title, this.listId).subscribe(
      (newNote: any) => {
        const note: Note = newNote as Note;
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      (error) => {
        console.log(error);
      }
    );
  }
}
