import { Component, OnInit } from '@angular/core';
import { Params, ActivatedRoute, Router } from '@angular/router';
import { NoteService } from 'src/app/note.service';

@Component({
  selector: 'app-edit-note',
  templateUrl: './edit-note.component.html',
  styleUrls: ['./edit-note.component.scss']
})
export class EditNoteComponent implements OnInit {

  constructor(private route: ActivatedRoute, private noteService: NoteService, private router: Router) { }

  noteId!: string;
  listId!: string;

  
  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.noteId = params['noteId'];
        this.listId = params['listId'];
      }
    )
  }

  updateNote(title: string) {
    this.noteService.updateNote(this.listId, this.noteId, title).subscribe(() => {
      this.router.navigate(['/lists', this.listId]);
    })
  }

}